import "server-only";

import { getAuth } from "@/lib/auth";
import { isAdminWallet } from "@/lib/admin";
import { isAdminPanelLoggedIn } from "@/lib/admin-session";

export async function hasAdminAccess() {
  const auth = await getAuth();
  if (auth.isLoggedIn && isAdminWallet(auth.walletAddress)) {
    return true;
  }
  return isAdminPanelLoggedIn();
}
