import type { Connection } from "@solana/web3.js";
import type { LaunchConfig, LaunchResult, LaunchpadService } from "./types";

/**
 * Base.meme integration placeholder.
 * Base.meme is not a Solana launchpad and requires Base chain execution.
 */
export const basememeService: LaunchpadService = {
  name: "Base.meme",
  id: "basememe",

  async createLaunchTransaction(
    _connection: Connection,
    _config: LaunchConfig
  ): Promise<LaunchResult> {
    throw new Error(
      "Base.meme requires Base chain execution and is not yet available in this Solana transaction flow."
    );
  },

  async estimateFee(): Promise<number> {
    return 0;
  },
};
