import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n";

/** Переключение языка интерфейса RU/KZ */
export async function POST(req: NextRequest) {
  const { locale } = await req.json().catch(() => ({}));
  const value = locale === "kk" ? "kk" : "ru";
  const res = NextResponse.json({ ok: true, locale: value });
  res.cookies.set(LOCALE_COOKIE, value, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
