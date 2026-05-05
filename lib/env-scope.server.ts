import "server-only";

import { APP_PHASE, SOLANA_NETWORK } from "@/lib/runtime-config";

export function getEnvironmentScope() {
  return {
    network: SOLANA_NETWORK,
    appPhase: APP_PHASE,
  };
}
