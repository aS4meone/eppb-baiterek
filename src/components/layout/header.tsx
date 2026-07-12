import Link from "next/link";
import { cookies } from "next/headers";
import { Landmark, User2 } from "lucide-react";
import { MobileNav } from "./mobile-nav";

const NAV = [
  { href: "/services", label: "Меры поддержки" },
  { href: "/map", label: "Карта проектов" },
  { href: "/reports", label: "Аналитика" },
  { href: "/materials", label: "Для бизнеса" },
];

export async function Header() {
  const authed = (await cookies()).get("eppb_session")?.value === "1";
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 md:gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-gold-400">
            <Landmark size={19} strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight text-brand-900">ЕППБ</span>
            <span className="block text-[10.5px] font-medium text-slate-500">холдинг «Байтерек»</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-800"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/admin"
            className="hidden rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:block"
          >
            Для сотрудников
          </Link>
          <Link
            href="/cabinet"
            className="flex items-center gap-2 rounded-xl bg-brand-800 px-3.5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-brand-700 sm:px-4 sm:text-[13.5px]"
          >
            <User2 size={15} className="shrink-0" />
            <span className="hidden sm:inline">{authed ? "Личный кабинет" : "Войти через eGov"}</span>
            <span className="sm:hidden">{authed ? "Кабинет" : "Войти"}</span>
          </Link>
          <MobileNav items={NAV} />
        </div>
      </div>
    </header>
  );
}
