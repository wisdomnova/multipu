/**
 * Privy Server Wallets Helper for Multipu Treasury
 * 
 * Provides programmatic management of Privy server wallets:
 * - Fetching wallet metadata
 * - Executing transfer actions on Solana (SOL) and BSC / EVM (BNB)
 * - Raw RPC signing fallback if needed
 */

interface PrivyWalletData {
  id: string;
  address: string;
  display_name?: string;
  chain_type: "solana" | "ethereum";
}

interface PrivyTransferResult {
  success: boolean;
  signature?: string;
  transactionHash?: string;
  actionId?: string;
  error?: string;
}

class PrivyTreasuryClient {
  private appId: string | null = null;
  private appSecret: string | null = null;
  private baseUrl = "https://api.privy.io";

  constructor() {
    this.appId = process.env.PRIVY_APP_ID || null;
    this.appSecret = process.env.PRIVY_APP_SECRET || null;
  }

  public getAppId(): string | null {
    return process.env.PRIVY_APP_ID || this.appId;
  }

  public getAppSecret(): string | null {
    return process.env.PRIVY_APP_SECRET || this.appSecret;
  }

  public isConfigured(): boolean {
    return !!(this.getAppId() && this.getAppSecret());
  }

  private getAuthHeader(): string {
    const id = this.getAppId();
    const secret = this.getAppSecret();
    if (!id || !secret) {
      throw new Error("Privy credentials not configured");
    }
    const token = Buffer.from(`${id}:${secret}`).toString("base64");
    return `Basic ${token}`;
  }

  /**
   * Fetch wallet metadata from Privy
   */
  public async getWallet(walletId: string): Promise<PrivyWalletData | null> {
    if (!this.isConfigured()) return null;

    try {
      const res = await fetch(`${this.baseUrl}/v1/wallets/${walletId}`, {
        method: "GET",
        headers: {
          "privy-app-id": this.getAppId()!,
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Privy] Failed to fetch wallet ${walletId}:`, res.status, errText);
        return null;
      }

      return (await res.json()) as PrivyWalletData;
    } catch (err) {
      console.error(`[Privy] Error fetching wallet ${walletId}:`, err);
      return null;
    }
  }

  /**
   * Execute transfer using Privy Wallet Actions API (/v1/wallets/{wallet_id}/transfer)
   */
  public async transfer(params: {
    walletId: string;
    chain: "solana" | "bsc";
    recipient: string;
    amount: number;
  }): Promise<PrivyTransferResult> {
    if (!this.isConfigured()) {
      return { success: false, error: "Privy credentials not configured" };
    }

    try {
      if (params.chain === "solana") {
        const payload = {
          source: {
            chain: "solana",
            asset: "sol",
          },
          destination: {
            address: params.recipient,
            chain: "solana",
            asset: "sol",
          },
          amount: params.amount,
        };

        const res = await fetch(`${this.baseUrl}/v1/wallets/${params.walletId}/transfer`, {
          method: "POST",
          headers: {
            "privy-app-id": this.getAppId()!,
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: data.error || data.message || `Privy transfer error HTTP ${res.status}`,
          };
        }

        // Parse signature / transaction hash from action or steps
        const signature =
          data.transaction_hash ||
          data.transaction_signature ||
          data.signature ||
          data.steps?.find((s: any) => s.transaction_hash)?.transaction_hash ||
          data.id;

        return {
          success: true,
          signature,
          actionId: data.id,
        };
      } else {
        // BSC / EVM: Use Privy RPC eth_sendTransaction or transfer
        // Convert BNB to wei hex
        const weiAmount = BigInt(Math.floor(params.amount * 1e18));
        const hexAmount = "0x" + weiAmount.toString(16);

        const rpcPayload = {
          method: "eth_sendTransaction",
          params: {
            transaction: {
              to: params.recipient,
              value: hexAmount,
              chainId: 56, // BNB Smart Chain Mainnet (or 97 for testnet)
            },
          },
        };

        const res = await fetch(`${this.baseUrl}/v1/wallets/${params.walletId}/rpc`, {
          method: "POST",
          headers: {
            "privy-app-id": this.getAppId()!,
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(rpcPayload),
        });

        const data = await res.json();

        if (!res.ok) {
          // Fallback to transfer endpoint
          const transferFallback = await fetch(`${this.baseUrl}/v1/wallets/${params.walletId}/transfer`, {
            method: "POST",
            headers: {
              "privy-app-id": this.appId!,
              Authorization: this.getAuthHeader(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source: { chain: "ethereum", asset: "eth" },
              destination: { address: params.recipient, chain: "ethereum", asset: "eth" },
              amount: params.amount,
            }),
          });

          const fallbackData = await transferFallback.json();
          if (!transferFallback.ok) {
            return {
              success: false,
              error: data.error || fallbackData.error || "Failed to execute EVM transfer via Privy",
            };
          }

          return {
            success: true,
            signature: fallbackData.transaction_hash || fallbackData.id,
            actionId: fallbackData.id,
          };
        }

        const txHash = data.data?.hash || data.result || data.id;

        return {
          success: true,
          signature: txHash,
          transactionHash: txHash,
        };
      }
    } catch (err: any) {
      console.error("[Privy] Withdrawal execution error:", err);
      return { success: false, error: err.message || "Network error communicating with Privy" };
    }
  }
}

export const privyTreasuryClient = new PrivyTreasuryClient();
