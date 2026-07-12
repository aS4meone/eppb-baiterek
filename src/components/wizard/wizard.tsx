"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, PenLine, Sparkles } from "lucide-react";
import type { Service, Stage } from "@/lib/engine/types";
import {
  stageProgress,
  validateStep,
  visibleFields,
  visibleSteps,
  type FormData,
} from "@/lib/engine/logic";

interface Props {
  service: Service;
  stageIndex: number;
  /** Профиль из eGov-сессии для предзаполнения prefill-полей */
  profile: Record<string, string>;
  references: Record<string, { value: string; label: string }[]>;
  /** При заполнении II этапа — данные ранее поданной заявки */
  applicationId?: number;
  initialData?: FormData;
}

/**
 * Универсальный wizard: рендерит ЛЮБУЮ услугу по её JSON-схеме.
 * Шаги и поля фильтруются условиями видимости на лету,
 * расчётные поля пересчитываются при каждом вводе.
 */
export function Wizard({ service, stageIndex, profile, references, applicationId, initialData }: Props) {
  const router = useRouter();
  const stage: Stage = service.schema.stages[stageIndex];
  const draftKey = `eppb-draft-${service.code}-${stageIndex}`;

  const [data, setData] = useState<FormData>(() => prefillData(stage, profile, initialData));
  const [stepIdx, setStepIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const steps = useMemo(() => visibleSteps(stage, data), [stage, data]);
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const [filled, total] = stageProgress(stage, data);
  const isLast = stepIdx === steps.length - 1;

  // восстановление черновика
  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved && !initialData) {
      try {
        setData((d) => ({ ...d, ...JSON.parse(saved) }));
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // автосохранение черновика
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(data));
      setDraftSavedAt(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    }, 800);
    return () => clearTimeout(t);
  }, [data, draftKey]);

  function onChange(id: string, value: unknown) {
    setData((d) => ({ ...d, [id]: value }));
    setErrors((e) => {
      if (!e[id]) return e;
      const rest = { ...e };
      delete rest[id];
      return rest;
    });
  }

  function next() {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length) {
      setErrors(errs);
      document.querySelector("[data-wizard-top]")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setErrors({});
    if (!isLast) {
      setStepIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submit();
    }
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          stageIndex,
          applicationId,
          data,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Ошибка отправки");
      localStorage.removeItem(draftKey);
      router.push(`/cabinet/applications/${result.id}?submitted=1`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Ошибка отправки — попробуйте ещё раз");
      setSubmitting(false);
    }
  }

  return (
    <div data-wizard-top className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[240px_1fr]">
      {/* Шаги слева */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-1">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i < stepIdx && setStepIdx(i)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                i === stepIdx
                  ? "bg-brand-800 text-white shadow-sm"
                  : i < stepIdx
                    ? "text-brand-700 hover:bg-brand-50"
                    : "cursor-default text-slate-400"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  i === stepIdx
                    ? "bg-white/15 text-gold-300"
                    : i < stepIdx
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < stepIdx ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              {s.title}
            </button>
          ))}

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="mb-1.5 flex justify-between text-[11.5px] font-bold text-slate-500">
              <span>Заполнено</span>
              <span className="tabular-nums">{filled} / {total}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                style={{ width: total ? `${(filled / total) * 100}%` : "0%" }}
              />
            </div>
            {draftSavedAt && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <PenLine size={11} /> Черновик сохранён в {draftSavedAt}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Текущий шаг */}
      <section className="card p-6 sm:p-8">
        <div className="mb-1 text-[12px] font-bold uppercase tracking-wide text-brand-400">
          Шаг {stepIdx + 1} из {steps.length}
        </div>
        <h2 className="text-[22px] font-extrabold tracking-tight text-brand-950">{step.title}</h2>
        {step.description && <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">{step.description}</p>}

        <div className="mt-6 space-y-5">
          {visibleFields(step, data).map((f) => (
            <div key={f.id} className="animate-fade-up">
              <FieldRenderer
                fieldId={f.id}
                step={step}
                data={data}
                errors={errors}
                references={references}
                serviceTitle={service.title}
                onChange={onChange}
              />
            </div>
          ))}
        </div>

        {submitError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
            {submitError}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            onClick={() => stepIdx > 0 && setStepIdx((i) => i - 1)}
            disabled={stepIdx === 0}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-slate-500 transition hover:bg-slate-100 disabled:invisible"
          >
            <ArrowLeft size={16} /> Назад
          </button>
          <button
            onClick={next}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-brand-800 px-6 py-3 text-[14px] font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Отправка…
              </>
            ) : isLast ? (
              <>
                <Sparkles size={16} /> {stageIndex > 0 ? "Подписать ЭЦП и отправить" : "Отправить заявку"}
              </>
            ) : (
              <>
                Далее <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

import { FieldInput } from "./field-input";
import type { Step } from "@/lib/engine/types";

function FieldRenderer({
  fieldId,
  step,
  data,
  errors,
  references,
  serviceTitle,
  onChange,
}: {
  fieldId: string;
  step: Step;
  data: FormData;
  errors: Record<string, string>;
  references: Record<string, { value: string; label: string }[]>;
  serviceTitle: string;
  onChange: (id: string, value: unknown) => void;
}) {
  const field = step.fields.find((f) => f.id === fieldId)!;
  return (
    <FieldInput
      field={field}
      data={data}
      error={errors[field.id]}
      options={field.reference ? references[field.reference] : undefined}
      serviceTitle={serviceTitle}
      onChange={onChange}
    />
  );
}

/** Предзаполнение prefill-полей из профиля (user.name, company.bin, …) */
function prefillData(stage: Stage, profile: Record<string, string>, initial?: FormData): FormData {
  const data: FormData = { ...(initial ?? {}) };
  for (const step of stage.steps) {
    for (const f of step.fields) {
      if (f.prefill && data[f.id] === undefined && profile[f.prefill]) {
        data[f.id] = profile[f.prefill];
      }
    }
  }
  return data;
}
