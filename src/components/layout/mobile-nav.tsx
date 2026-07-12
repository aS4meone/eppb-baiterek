"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

interface Props {
  items: { href: string; label: string }[];
}

export function MobileNav({ items }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
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
              Для сотрудников
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
