import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Calculator, CheckSquare, Download, FileSpreadsheet, GraduationCap, TrendingUp } from "lucide-react";
import { listMaterials } from "@/lib/repo";

export const metadata: Metadata = { title: "Инструменты для бизнеса" };

const KIND_META: Record<string, { icon: typeof BookOpen; color: string }> = {
  guide: { icon: BookOpen, color: "bg-blue-50 text-blue-600" },
  template: { icon: FileSpreadsheet, color: "bg-violet-50 text-violet-600" },
  calculator: { icon: Calculator, color: "bg-emerald-50 text-emerald-600" },
  checklist: { icon: CheckSquare, color: "bg-amber-50 text-amber-600" },
  course: { icon: GraduationCap, color: "bg-pink-50 text-pink-600" },
  review: { icon: TrendingUp, color: "bg-cyan-50 text-cyan-600" },
};

export default function MaterialsPage() {
  const materials = listMaterials();
  const categories = [...new Set(materials.map((m) => m.category))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-[28px] font-extrabold tracking-tight text-brand-950">Инструменты для бизнеса</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-slate-500">
        База знаний, шаблоны документов, чек-листы и калькуляторы — всё, что помогает запустить
        и развивать бизнес, в одном месте.
      </p>

      <div className="mt-8 space-y-8">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="mb-3.5 text-[15px] font-extrabold text-brand-900">{cat}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials
                .filter((m) => m.category === cat)
                .map((m) => {
                  const meta = KIND_META[m.kind] ?? KIND_META.guide;
                  const inner = (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.color}`}>
                          <meta.icon size={17} />
                        </span>
                        {m.kind === "template" && <Download size={14} className="text-slate-300" />}
                      </div>
                      <h3 className="mt-3.5 text-[14.5px] font-extrabold leading-snug text-brand-950 group-hover:text-brand-700">
                        {m.title}
                      </h3>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{m.description}</p>
                    </>
                  );
                  return m.url ? (
                    <Link key={m.id} href={m.url} className="card card-hover group flex flex-col p-5">
                      {inner}
                    </Link>
                  ) : (
                    <div key={m.id} className="card card-hover group flex cursor-pointer flex-col p-5">
                      {inner}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
