import type { Project } from "@/lib/repo";
import { formatMoney } from "@/lib/format";

/**
 * Встроенная аналитика портала: агрегаты по портфелю проектов группы.
 * Считается из данных ИС Аналитического центра (в демо — seed), рендерится
 * на сервере без клиентского JS.
 */
export function PortfolioCharts({ projects }: { projects: Project[] }) {
  const total = projects.reduce((s, p) => s + p.amount, 0);
  const active = projects.filter((p) => p.status === "Реализуется").length;

  const byRegion = aggregate(projects, (p) => p.region).slice(0, 8);
  const byIndustry = aggregate(projects, (p) => p.industry);
  const byOrg = aggregate(projects, (p) => shortOrg(p.organization));

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <h2 className="text-[17px] font-extrabold text-brand-950">Портфель проектов группы</h2>
        <span className="text-[12.5px] font-semibold text-slate-400">
          {projects.length} проектов · {active} в реализации · данные ИС Аналитического центра
        </span>
        <span className="ml-auto text-[20px] font-extrabold tabular-nums text-brand-900">
          {formatMoney(total / 1e9)} <span className="text-[13px] font-bold text-slate-400">млрд ₸</span>
        </span>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-3">
        <BarBlock title="По регионам" items={byRegion} accent="bg-brand-600" />
        <BarBlock title="По отраслям" items={byIndustry} accent="bg-brand-400" />
        <BarBlock title="По институтам развития" items={byOrg} accent="bg-gold-500" />
      </div>
    </section>
  );
}

function aggregate(projects: Project[], key: (p: Project) => string) {
  const m = new Map<string, { amount: number; count: number }>();
  for (const p of projects) {
    const k = key(p);
    const cur = m.get(k) ?? { amount: 0, count: 0 };
    m.set(k, { amount: cur.amount + p.amount, count: cur.count + 1 });
  }
  return [...m.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.amount - a.amount);
}

function shortOrg(org: string): string {
  return org
    .replace("АО «Фонд развития предпринимательства «Даму»", "Даму")
    .replace("АО «Банк Развития Казахстана»", "БРК")
    .replace("АО «Аграрная кредитная корпорация»", "АКК")
    .replace("АО «КазАгроФинанс»", "КазАгроФинанс")
    .replace("АО «ЭСК KazakhExport»", "KazakhExport")
    .replace("АО «Отбасы банк»", "Отбасы банк")
    .replace("АО «Qazaqstan Investment Corporation»", "QIC")
    .replace("АО «Фонд развития промышленности»", "ФРП");
}

function BarBlock({
  title,
  items,
  accent,
}: {
  title: string;
  items: { label: string; amount: number; count: number }[];
  accent: string;
}) {
  const max = Math.max(...items.map((i) => i.amount), 1);
  return (
    <div>
      <h3 className="text-[11.5px] font-extrabold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-3 space-y-2.5">
        {items.map((i) => (
          <div key={i.label}>
            <div className="flex items-baseline justify-between gap-2 text-[12px]">
              <span className="truncate font-bold text-slate-600">{i.label}</span>
              <span className="shrink-0 tabular-nums font-extrabold text-brand-900">
                {formatMoney(i.amount / 1e9)} <span className="font-semibold text-slate-400">млрд</span>
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${accent}`}
                style={{ width: `${Math.max(3, (i.amount / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
