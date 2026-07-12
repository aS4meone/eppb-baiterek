import { cookies } from "next/headers";

/**
 * Сессии MVP: httpOnly-cookie. Пользователь — имитация eGov IDP,
 * администратор — пароль (env EPPB_ADMIN_PASSWORD, в демо задан по умолчанию).
 * В проде заменяется на eGov IDP OAuth и корпоративный SSO Холдинга.
 */

export const ADMIN_COOKIE = "eppb_admin";
export const USER_COOKIE = "eppb_session";

export function adminPassword(): string {
  return process.env.EPPB_ADMIN_PASSWORD || "baiterek2026";
}

export async function isAdmin(): Promise<boolean> {
  return (await cookies()).get(ADMIN_COOKIE)?.value === "1";
}

export async function isUser(): Promise<boolean> {
  return (await cookies()).get(USER_COOKIE)?.value === "1";
}
