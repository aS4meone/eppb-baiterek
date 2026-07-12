"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LangSwitch } from "./lang-switch";
import type { Locale } from "@/lib/i18n";

interface Props {
  items: { href: string; label: string }[];
  staffLabel: string;
  locale: Locale;
}

export function MobileNav({ items, staffLabel, locale }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Меню"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 z-50 border-b border-slate-200 bg-white shadow-lg animate-fade-up">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-[14px] font-bold text-slate-700 transition hover:bg-brand-50 hover:text-brand-800"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-400 transition hover:bg-slate-100"
            >
              {staffLabel}
            </Link>
            <div className="px-4 pt-2 sm:hidden">
              <LangSwitch locale={locale} />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
