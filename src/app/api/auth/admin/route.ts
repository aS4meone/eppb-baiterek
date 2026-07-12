import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword, signSession } from "@/lib/auth";

/** Вход администратора. В проде — корпоративный SSO Холдинга. */
export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  if (password !== adminPassword()) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, signSession("admin"), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
