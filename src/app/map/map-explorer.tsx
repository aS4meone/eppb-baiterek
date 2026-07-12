"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Building2, Factory, MapPin } from "lucide-react";
import type { Project } from "@/lib/repo";
import { formatMoney } from "@/lib/format";

const ProjectsMap = dynamic(() => import("./projects-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-2xl bg-slate-100 text-[13px] font-semibold text-slate-400">
      Загружаем карту…
    </div>
  ),
});

export interface MapFilters {
  org: string;
  industry: string;
  status: string;
}

export function MapExplorer({ projects }: { projects: Project[] }) {
  const [filters, setFilters] = useState<MapFilters>({ org: "", industry: "", status: "" });
  const [selected, setSelected] = useState<Project | null>(null);

  const orgs = useMemo(() => [...new Set(projects.map((p) => p.organization))].sort(), [projects]);
  const industries = useMemo(() => [...new Set(projects.map((p) => p.industry))].sort(), [projects]);
  const statuses = useMemo(() => [...new Set(projects.map((p) => p.status))], [projects]);

  const filtered = projects.filter(
    (p) =>
      (!filters.org || p.organization === filters.org) &&
      (!filters.industry || p.industry === filters.industry) &&
      (!filters.status || p.status === filters.status)
  );

  const byRegion = useMemo(() => {
    const m = new Map<string, { count: number; amount: number }>();
    for (const p of filtered) {
      const cur = m.get(p.region) ?? { count: 0, amount: 0 };
      m.set(p.region, { count: cur.count + 1, amount: cur.amount + p.amount });
    }
    return [...m.entries()].sort((a, b) => b[1].amount - a[1].amount);
  }, [filtered]);

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex flex-wrap gap-2.5">
        <FilterSelect
          value={filters.org}
          placeholder="Все организации"
          options={orgs}
          onChange={(v) => setFilters((f) => ({ ...f, org: v }))}
        />
        <FilterSelect
          value={filters.industry}
          placeholder="Все отрасли"
          options={industries}
          onChange={(v) => setFilters((f) => ({ ...f, industry: v }))}
        />
        <FilterSelect
          value={filters.status}
          placeholder="Все статусы"
          options={statuses}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        />
        <div className="ml-auto flex items-center gap-4 rounded-xl bg-brand-50 px-4 py-2 text-[12.5px] font-bold text-brand-800">
          <span>{filtered.length} проектов</span>
          <span className="tabular-nums">{formatMoney(totalAmount / 1e9)} млрд ₸</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Карта */}
        <div className="card overflow-hidden">
          <ProjectsMap projects={filtered} selected={selected} onSelect={setSelected} />
        </div>

        {/* Сайдбар */}
        <div className="space-y-4">
          {selected ? (
            <div className="card animate-fade-up p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-extrabold leading-snug text-brand-950">{selected.name}</h3>
                <button onClick={() => setSelected(null)} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">
                  Закрыть
                </button>
              </div>
              <div className="mt-3 space-y-2 text-[12.5px]">
                <Row icon={Building2} label={selected.organization} />
                <Row icon={MapPin} label={`${selected.region}${selected.locality ? `, ${selected.locality}` : ""}`} />
                <Row icon={Factory} label={selected.industry} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat label="Финансирование" value={`${formatMoney(selected.amount / 1e9)} млрд ₸`} />
                <Stat label="Период" value={selected.period} />
              </div>
              <div className="mt-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ${
                    selected.status === "Введён в эксплуатацию" || selected.status === "Завершён"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {selected.status}
                </span>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">{selected.description}</p>
            </div>
          ) : (
            <div className="card p-5">
              <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-slate-400">По регионам</h3>
              <ul className="mt-3 space-y-2">
                {byRegion.map(([region, agg]) => (
                  <li key={region} className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="font-semibold text-slate-600">{region}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums font-bold text-brand-800">{formatMoney(agg.amount / 1e9)} млрд</span>
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-50 px-1.5 text-[10.5px] font-extrabold text-brand-700">
                        {agg.count}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11.5px] leading-snug text-slate-400">
                Кликните на точку на карте, чтобы открыть карточку проекта. Размер точки — объём финансирования.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-bold text-slate-600 outline-none transition focus:border-brand-400"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Row({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <Icon size={14} className="shrink-0 text-brand-400" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-[14px] font-extrabold text-brand-900">{value}</div>
    </div>
  );
}
