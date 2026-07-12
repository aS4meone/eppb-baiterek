"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface Props {
  categories: string[];
  orgs: string[];
  active: { q?: string; category?: string; org?: string };
}

export function CatalogFilters({ categories, orgs, active }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(active.q ?? "");

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/services?${next.toString()}`);
  }

  return (
    <div className="space-y-3.5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam("q", q.trim() || undefined);
        }}
        className="relative max-w-lg"
      >
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по услугам…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        {active.q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setParam("q", undefined);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        )}
      </form>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip label="Все категории" active={!active.category} onClick={() => setParam("category", undefined)} />
        {categories.map((c) => (
          <FilterChip key={c} label={c} active={active.category === c} onClick={() => setParam("category", c)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip label="Все организации" active={!active.org} onClick={() => setParam("org", undefined)} muted />
        {orgs.map((o) => (
          <FilterChip
            key={o}
            label={o.replace("АО «", "").replace("»", "").replace("Фонд развития предпринимательства «Даму", "Фонд «Даму")}
            active={active.org === o}
            onClick={() => setParam("org", o)}
            muted
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick, muted }: { label: string; active: boolean; onClick: () => void; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${
        active
          ? "bg-brand-800 text-white shadow-sm"
          : muted
            ? "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-brand-300"
            : "bg-brand-50 text-brand-700 hover:bg-brand-100"
      }`}
    >
      {label}
    </button>
  );
}
