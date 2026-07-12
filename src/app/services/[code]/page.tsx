import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, ChevronRight, Layers, Users2 } from "lucide-react";
import { getService } from "@/lib/repo";
import { stageProgress } from "@/lib/engine/logic";

export default async function ServicePage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const service = getService(code);
  if (!service || service.status !== "published") notFound();

  const stage1 = service.schema.stages[0];
  const [, requiredCount] = stageProgress(stage1, {});
  const questionsTotal = stage1.steps.reduce((n, s) => n + s.fields.filter((f) => f.type !== "info").length, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-400">
        <Link href="/" className="hover:text-brand-600">Главная</Link>
        <ChevronRight size={13} />
        <Link href="/services" className="hover:text-brand-600">Меры поддержки</Link>
        <ChevronRight size={13} />
        <span className="text-slate-600">{service.title}</span>
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-brand-50 px-2.5 py-1 text-[11.5px] font-bold text-brand-700">{service.category}</span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-500">{service.direction}</span>
          </div>
          <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-brand-950">
            {service.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">{service.description}</p>

          <div className="card mt-7 grid grid-cols-2 gap-px overflow-hidden bg-slate-100 sm:grid-cols-4">
            {service.conditions.map((c) => (
              <div key={c.code} className="bg-white p-4.5">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{c.title}</div>
                <div className="mt-1 text-[18px] font-extrabold text-brand-900">{c.value}</div>
              </div>
            ))}
          </div>

          {/* Этапы услуги */}
          <h2 className="mt-9 text-[18px] font-extrabold text-brand-950">Как проходит услуга</h2>
          <div className="mt-4 space-y-3">
            {service.schema.stages.map((stage, i) => (
              <div key={stage.id} className="card flex gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-[13px] font-extrabold text-gold-300">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[14.5px] font-extrabold text-brand-950">{stage.title}</div>
                  {stage.description && (
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{stage.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-semibold text-slate-400">
                    {stage.steps.map((s) => (
                      <span key={s.id} className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-brand-300" />
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3.5 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
            <Users2 size={18} className="mt-0.5 shrink-0 text-brand-500" />
            <div className="text-[13px] leading-relaxed text-slate-600">
              <span className="font-bold text-brand-900">Кому подходит: </span>
              {service.audience.join(", ")}
            </div>
          </div>
        </div>

        {/* Сайдбар подачи */}
        <aside>
          <div className="card sticky top-24 p-6">
            <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-500">
              <Building2 size={16} className="text-brand-400" />
              {service.organization}
            </div>

            <div className="mt-5 space-y-2.5 text-[13px] text-slate-600">
              <div className="flex justify-between">
                <span>Вопросов на I этапе</span>
                <span className="font-extrabold text-brand-900">~{questionsTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Обязательных полей</span>
                <span className="font-extrabold text-brand-900">{requiredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Время заполнения</span>
                <span className="font-extrabold text-brand-900">≈ {Math.max(3, Math.round(questionsTotal * 0.6))} мин</span>
              </div>
              {service.schema.stages.length > 1 && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-500">
                  <Layers size={13} />
                  Многоэтапная услуга: документы понадобятся только на II этапе
                </div>
              )}
            </div>

            <Link
              href={`/services/${service.code}/apply`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-800 px-5 py-3.5 text-[14.5px] font-extrabold text-white shadow-sm transition hover:bg-brand-700"
            >
              Подать заявку <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-center text-[11.5px] leading-snug text-slate-400">
              Форма собрана в конструкторе ЕППБ · версия схемы v{service.version}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
