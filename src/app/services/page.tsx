import type { Metadata } from "next";
import { listServices } from "@/lib/repo";
import { ServiceCard } from "@/components/service-card";
import { CatalogFilters } from "./filters";

export const metadata: Metadata = { title: "Каталог мер поддержки" };

export default async function ServicesPage(props: {
  searchParams: Promise<{ q?: string; category?: string; org?: string }>;
}) {
  const { q, category, org } = await props.searchParams;
  const all = listServices();

  const categories = [...new Set(all.map((s) => s.category))];
  const orgs = [...new Set(all.map((s) => s.organization))];

  const query = (q ?? "").toLowerCase().trim();
  const filtered = all.filter((s) => {
    if (category && s.category !== category) return false;
    if (org && s.organization !== org) return false;
    if (query) {
      const hay = `${s.title} ${s.summary} ${s.description} ${s.direction} ${s.category}`.toLowerCase();
      if (!query.split(/\s+/).some((w) => hay.includes(w))) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-[28px] font-extrabold tracking-tight text-brand-950">Меры поддержки</h1>
      <p className="mt-1 text-[14px] text-slate-500">
        {all.length} услуг восьми институтов развития группы «Байтерек»
      </p>

      <div className="mt-6">
        <CatalogFilters categories={categories} orgs={orgs} active={{ q, category, org }} />
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-[15px] font-bold text-slate-600">По запросу ничего не найдено</p>
          <p className="mt-1 text-[13px] text-slate-400">
            Попробуйте изменить формулировку или спросите AI-помощника в правом нижнем углу
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
