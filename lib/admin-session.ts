import "server-only";

import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

export interface AdminSessionData {
  isAdminLoggedIn: boolean;
}

const defaultAdminSession: AdminSessionData = {
  isAdminLoggedIn: false,
};

export const adminSessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long_for_dev_only",
  cookieName: "multipu_admin_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 12,
    path: "/",
  },
};

export async function getAdminSession() {
  return getIronSession<AdminSessionData>(
    await cookies(),
    adminSessionOptions
  );
}

export async function isAdminPanelLoggedIn() {
  try {
    const session = await getAdminSession();
    return Boolean(session.isAdminLoggedIn);
  } catch {
    return false;
  }
}

export async function setAdminPanelLogin(
  session: IronSession<AdminSessionData>,
  isLoggedIn: boolean
) {
  session.isAdminLoggedIn = isLoggedIn;
  await session.save();
}

export { defaultAdminSession };
