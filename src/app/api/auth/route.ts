import { NextRequest, NextResponse } from "next/server";

/**
 * Имитация авторизации через eGov IDP (OAuth 2.0).
 * В проде: redirect на idp.egov.kz/oauth/authorize → обмен кода на токен.
 * В демо: сразу выдаём сессию демо-пользователя.
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("eppb_session", "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("eppb_session");
  return res;
}
