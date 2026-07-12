import type { Metadata } from "next";
import { BarChart3, CalendarDays, ExternalLink, FileText, LineChart, PieChart } from "lucide-react";
import { listReports } from "@/lib/repo";

export const metadata: Metadata = { title: "Аналитическая отчётность" };

const KIND_ICON: Record<string, typeof FileText> = {
  "Годовой отчёт": FileText,
  "Финансовая отчётность": PieChart,
  "Интерактивный дашборд": BarChart3,
  "Аналитический отчёт": LineChart,
  "Исследование": LineChart,
};

export default function ReportsPage() {
  const reports = listReports();
  const orgs = [...new Set(reports.map((r) => r.organization))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-[28px] font-extrabold tracking-tight text-brand-950">Аналитическая отчётность</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-slate-500">
        Годовые отчёты, финансовая отчётность, дашборды и исследования Холдинга и дочерних организаций.
        Материалы открываются на стороне источника или встраиваются в портал.
      </p>

      <div className="mt-8 space-y-8">
        {orgs.map((org) => (
          <section key={org}>
            <h2 className="mb-3.5 text-[15px] font-extrabold text-brand-900">{org}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports
                .filter((r) => r.organization === org)
                .map((r) => {
                  const Icon = KIND_ICON[r.kind] ?? FileText;
                  return (
                    <a
                      key={r.id}
                      href={r.sourceUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card card-hover group flex flex-col p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                          <Icon size={17} />
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10.5px] font-bold text-slate-500">
                          {r.kind}
                        </span>
                      </div>
                      <h3 className="mt-3.5 text-[14.5px] font-extrabold leading-snug text-brand-950 group-hover:text-brand-700">
                        {r.title}
                        <ExternalLink size={12} className="ml-1.5 inline -translate-y-px text-slate-300 group-hover:text-brand-500" />
                      </h3>
                      <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-slate-500">{r.description}</p>
                      <div className="mt-3.5 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11.5px] font-bold text-slate-400">
                        <CalendarDays size={12} />
                        Период: {r.period}
                      </div>
                    </a>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
