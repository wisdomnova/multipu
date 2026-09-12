import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { ethers } from "ethers";
import { privyTreasuryClient } from "./privy-treasury";
import { createAdminSupabase } from "./supabase/server";

export type TreasuryChain = "solana" | "bsc";

class TreasuryManager {
  private solanaKeypair: Keypair | null = null;
  private solanaConnection: Connection | null = null;
  private solanaTreasuryAddress: string | null = null;
  private bscTreasuryAddress: string | null = null;
  private privySolanaWalletId: string | null = null;
  private privyBscWalletId: string | null = null;

  constructor() {
    this.initializeAddresses();
    this.initializeLocalKeypair();
  }

  private initializeAddresses() {
    // 1. Solana
    this.solanaTreasuryAddress = process.env.TREASURY_SOLANA_WALLET_ADDRESS || null;
    this.privySolanaWalletId = process.env.PRIVY_SOLANA_WALLET_ID || null;

    // 2. BSC
    this.bscTreasuryAddress = process.env.TREASURY_BSC_WALLET_ADDRESS || null;
    this.privyBscWalletId = process.env.PRIVY_BSC_WALLET_ID || null;

    // Setup Solana Connection
    const rpcUrl =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      process.env.SOLANA_RPC_URL ||
      (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
        ? "https://api.mainnet-beta.solana.com"
        : "https://api.devnet.solana.com");
    this.solanaConnection = new Connection(rpcUrl, "confirmed");
  }

  private initializeLocalKeypair() {
    const secretKeyString = process.env.TREASURY_SOLANA_WALLET_SECRET;
    if (secretKeyString) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
        this.solanaKeypair = Keypair.fromSecretKey(secretKey);
        if (!this.solanaTreasuryAddress) {
          this.solanaTreasuryAddress = this.solanaKeypair.publicKey.toBase58();
        }
      } catch (error) {
        console.warn("[Treasury] Local Solana secret keypair not parsed (Privy mode preferred):", error);
      }
    }
  }

  public getSolanaTreasuryAddress(): string | null {
    return process.env.TREASURY_SOLANA_WALLET_ADDRESS || this.solanaTreasuryAddress;
  }

  public getBscTreasuryAddress(): string | null {
    return process.env.TREASURY_BSC_WALLET_ADDRESS || this.bscTreasuryAddress;
  }

  public getPrivySolanaWalletId(): string | null {
    return process.env.PRIVY_SOLANA_WALLET_ID || this.privySolanaWalletId;
  }

  public getPrivyBscWalletId(): string | null {
    return process.env.PRIVY_BSC_WALLET_ID || this.privyBscWalletId;
  }

  public getSolanaConnection(): Connection {
    if (!this.solanaConnection) {
      const rpcUrl =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        process.env.SOLANA_RPC_URL ||
        (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
          ? "https://api.mainnet-beta.solana.com"
          : "https://api.devnet.solana.com");
      this.solanaConnection = new Connection(rpcUrl, "confirmed");
    }
    return this.solanaConnection;
  }

  public isConfigured(chain: TreasuryChain): boolean {
    if (chain === "solana") {
      // Configured if Privy server wallet ID exists OR local keypair exists
      const hasPrivy = privyTreasuryClient.isConfigured() && !!this.getPrivySolanaWalletId();
      const hasKeypair = !!(this.solanaKeypair && this.getSolanaTreasuryAddress());
      return hasPrivy || hasKeypair;
    }

    if (chain === "bsc") {
      // Configured if Privy BSC wallet ID exists
      return privyTreasuryClient.isConfigured() && !!this.getPrivyBscWalletId();
    }

    return false;
  }

  public getProvider(chain: TreasuryChain): "privy" | "keypair" | "none" {
    if (chain === "solana") {
      if (privyTreasuryClient.isConfigured() && this.getPrivySolanaWalletId()) return "privy";
      if (this.solanaKeypair) return "keypair";
    }
    if (chain === "bsc") {
      if (privyTreasuryClient.isConfigured() && this.getPrivyBscWalletId()) return "privy";
    }
    return "none";
  }

  public getTreasuryAddress(chain: TreasuryChain): string | null {
    return chain === "solana" ? this.getSolanaTreasuryAddress() : this.getBscTreasuryAddress();
  }

  public async getTreasuryBalance(chain: TreasuryChain): Promise<number> {
    try {
      if (chain === "solana") {
        const address = this.getSolanaTreasuryAddress();
        if (address) {
          const conn = this.getSolanaConnection();
          const balanceLamports = await conn.getBalance(new PublicKey(address));
          return balanceLamports / LAMPORTS_PER_SOL;
        }
      }

      if (chain === "bsc") {
        const address = this.getBscTreasuryAddress();
        if (address) {
          const bscRpc = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
          const provider = new ethers.JsonRpcProvider(bscRpc, 56, { staticNetwork: true });
          const balanceWei = await provider.getBalance(address);
          return parseFloat(ethers.formatEther(balanceWei));
        }
      }
    } catch (error) {
      console.warn(`[Treasury] Failed to fetch live balance for ${chain}:`, error);
    }
    return 0;
  }

  public async executeWithdrawal(
    chain: TreasuryChain,
    recipient: string,
    amount: number,
    adminWallet: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    // 1. Privy Server Wallet Path (Recommended & Default)
    if (privyTreasuryClient.isConfigured()) {
      const walletId = chain === "solana" ? this.privySolanaWalletId : this.privyBscWalletId;

      if (!walletId) {
        return { success: false, error: `Privy ${chain.toUpperCase()} wallet ID not configured` };
      }

      const result = await privyTreasuryClient.transfer({
        walletId,
        chain,
        recipient,
        amount,
      });

      // If successful, log transfer into Supabase
      if (result.success && result.signature) {
        await this.logTransferRecord({
          chain,
          from_wallet: this.getTreasuryAddress(chain) || walletId,
          to_wallet: recipient,
          amount_native: amount,
          signature: result.signature,
          fee_type: "manual_withdrawal",
          status: "confirmed",
          reason: `Admin withdrawal executed by ${adminWallet}`,
        });
      }

      return result;
    }

    // 2. Local Solana Keypair Fallback (Legacy)
    if (chain === "solana" && this.solanaKeypair && this.solanaConnection) {
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: this.solanaKeypair.publicKey,
            toPubkey: new PublicKey(recipient),
            lamports: Math.floor(amount * LAMPORTS_PER_SOL),
          })
        );

        const signature = await sendAndConfirmTransaction(this.solanaConnection, transaction, [this.solanaKeypair]);

        await this.logTransferRecord({
          chain: "solana",
          from_wallet: this.solanaKeypair.publicKey.toBase58(),
          to_wallet: recipient,
          amount_native: amount,
          signature,
          fee_type: "manual_withdrawal",
          status: "confirmed",
          reason: `Admin withdrawal executed by ${adminWallet}`,
        });

        return { success: true, signature };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: `No withdrawal signing provider configured for ${chain.toUpperCase()}` };
  }

  /**
   * Log transfer record into Supabase treasury_transfers
   */
  private async logTransferRecord(record: {
    chain: string;
    from_wallet: string;
    to_wallet: string;
    amount_native: number;
    signature: string;
    fee_type: string;
    status: string;
    reason?: string;
  }) {
    try {
      const supabase = createAdminSupabase();
      await supabase.from("treasury_transfers").insert({
        ...record,
        confirmed_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("[Treasury] Could not write to treasury_transfers table:", err);
    }
  }

  /**
   * Fetch transfer history from database
   */
  public async getTransfersHistory(): Promise<any[]> {
    try {
      const supabase = createAdminSupabase();
      const { data, error } = await supabase
        .from("treasury_transfers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn("[Treasury] Error reading transfers history:", err);
    }
    return [];
  }
}

export const treasuryManager = new TreasuryManager();
