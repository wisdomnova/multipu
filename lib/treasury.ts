import { Keypair, Connection, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";

/**
 * SERVER-SIDE SECURITY WARNING:
 * This file handles sensitive wallet keys and treasury operations.
 * It must only be executed in a secure server-side environment.
 * Ensure environment variables are properly protected.
 */

export type TreasuryChain = "solana" | "bsc";

class TreasuryManager {
  private solanaKeypair: Keypair | null = null;
  private solanaConnection: Connection | null = null;
  private solanaTreasuryAddress: string | null = null;
  private bscTreasuryAddress: string | null = null;

  constructor() {
    this.initializeSolana();
    this.initializeBscAddress();
  }

  private initializeSolana() {
    const address = process.env.TREASURY_SOLANA_WALLET_ADDRESS;
    const secretKeyString = process.env.TREASURY_SOLANA_WALLET_SECRET;
    const clusterUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

    if (address && secretKeyString) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
        this.solanaKeypair = Keypair.fromSecretKey(secretKey);
        this.solanaTreasuryAddress = address;
        this.solanaConnection = new Connection(clusterUrl, "confirmed");
      } catch (error) {
        console.error("Failed to initialize Solana treasury:", error);
      }
    }
  }

  private initializeBscAddress() {
    this.bscTreasuryAddress = process.env.TREASURY_BSC_WALLET_ADDRESS || null;
    // Note: BSC private key handling would transition to an EVM provider setup
  }

  public isConfigured(chain: TreasuryChain): boolean {
    if (chain === "solana") {
      return this.solanaKeypair !== null && this.solanaConnection !== null;
    }
    if (chain === "bsc") {
      return this.bscTreasuryAddress !== null;
    }
    return false;
  }

  public getTreasuryAddress(chain: TreasuryChain): string | null {
    return chain === "solana" ? this.solanaTreasuryAddress : this.bscTreasuryAddress;
  }

  public async getTreasuryBalance(chain: TreasuryChain): Promise<number> {
    if (chain === "solana" && this.solanaConnection && this.solanaKeypair) {
      try {
        const balance = await this.solanaConnection.getBalance(this.solanaKeypair.publicKey);
        return balance / LAMPORTS_PER_SOL;
      } catch (error) {
        console.error("Error fetching Solana balance:", error);
        return 0;
      }
    }
    // BSC balance implementation would go here
    return 0;
  }

  public async executeWithdrawal(
    chain: TreasuryChain,
    recipient: string,
    amount: number,
    admin: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> {

    if (chain === "solana") {
      if (!this.solanaKeypair || !this.solanaConnection) {
        return { success: false, error: "Solana treasury not configured" };
      }

      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: this.solanaKeypair.publicKey,
            toPubkey: new PublicKey(recipient),
            lamports: amount * LAMPORTS_PER_SOL,
          })
        );

        const signature = await sendAndConfirmTransaction(
          this.solanaConnection,
          transaction,
          [this.solanaKeypair]
        );

        return { success: true, signature };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    if (chain === "bsc") {
      // BSC withdrawal logic using ethers.js or web3.js would be implemented here
      return { success: false, error: "BSC withdrawal not yet implemented" };
    }

    return { success: false, error: "Unsupported chain" };
  }

  public async getTransfersHistory(): Promise<any[]> {
    // Audit log or on-chain history retrieval
    return [];
  }
}

export const treasuryManager = new TreasuryManager();
