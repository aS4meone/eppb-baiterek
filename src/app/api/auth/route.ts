import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE, signSession } from "@/lib/auth";

/**
 * Имитация авторизации через eGov IDP (OAuth 2.0).
 * В проде: redirect на idp.egov.kz/oauth/authorize → обмен кода на токен.
 * В демо: сразу выдаём подписанную сессию демо-пользователя.
 */
export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, signSession("user"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(USER_COOKIE);
  return res;
}
