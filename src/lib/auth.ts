import { cookies } from "next/headers";
import crypto from "node:crypto";

/**
 * Сессии MVP: подписанные HMAC-cookie (не подделать без секрета).
 * Пользователь — имитация eGov IDP, администратор — пароль.
 * В проде заменяется на eGov IDP OAuth и корпоративный SSO Холдинга.
 */

export const ADMIN_COOKIE = "eppb_admin";
export const USER_COOKIE = "eppb_session";

function secret(): string {
  return process.env.EPPB_SESSION_SECRET || "eppb-demo-secret-change-in-prod-9f3a";
}

export function adminPassword(): string {
  return process.env.EPPB_ADMIN_PASSWORD || "baiterek2026";
}

/** Подписанный токен вида "<payload>.<hmac>" — значение нельзя подделать без секрета */
export function signSession(role: "admin" | "user", subject = "1"): string {
  const payload = `${role}:${subject}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

function verify(token: string | undefined, role: "admin" | "user"): boolean {
  if (!token || !token.includes(".")) return false;
  const [b64, sig] = token.split(".");
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString();
  } catch {
    return false;
  }
  if (!payload.startsWith(`${role}:`)) return false;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  // сравнение постоянного времени
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  return verify((await cookies()).get(ADMIN_COOKIE)?.value, "admin");
}

export async function isUser(): Promise<boolean> {
  return verify((await cookies()).get(USER_COOKIE)?.value, "user");
}
