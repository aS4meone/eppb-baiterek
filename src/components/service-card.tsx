import Link from "next/link";
import { ArrowUpRight, Flame } from "lucide-react";
import type { Service } from "@/lib/engine/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Кредитование": "bg-blue-50 text-blue-700",
  "Лизинг": "bg-violet-50 text-violet-700",
  "Гарантирование": "bg-emerald-50 text-emerald-700",
  "Страхование": "bg-amber-50 text-amber-700",
  "Инвестиции": "bg-pink-50 text-pink-700",
  "Жильё": "bg-cyan-50 text-cyan-700",
};

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.code}`}
      className="card card-hover group flex flex-col p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${CATEGORY_COLORS[service.category] ?? "bg-slate-100 text-slate-600"}`}>
          {service.category}
        </span>
        {service.isPopular && (
          <span className="flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-600">
            <Flame size={11} /> Популярная
          </span>
        )}
        {service.schema.stages.length > 1 && (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
            {service.schema.stages.length} этапа
          </span>
        )}
      </div>

      <h3 className="text-[16px] font-extrabold leading-snug tracking-tight text-brand-950 group-hover:text-brand-700">
        {service.title}
        <ArrowUpRight size={15} className="ml-1 inline -translate-y-px text-slate-300 transition group-hover:text-brand-500" />
      </h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-slate-500">{service.summary}</p>

      {service.conditions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-slate-100 pt-3.5">
          {service.conditions.slice(0, 3).map((c) => (
            <div key={c.code}>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{c.title}</div>
              <div className="text-[13px] font-extrabold text-brand-900">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 text-[11.5px] font-semibold text-slate-400">{service.organization}</div>
    </Link>
  );
}
