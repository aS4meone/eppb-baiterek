"use client";

import { useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import type { ServiceSchema } from "@/lib/engine/types";
import { visibleFields, visibleSteps, type FormData } from "@/lib/engine/logic";
import { FieldInput } from "@/components/wizard/field-input";

/**
 * Живой предпросмотр: рендерит текущую (несохранённую) схему тем же
 * движком, что и клиентский wizard. Автор сразу видит ветвления и расчёты.
 */
export function SchemaPreview({
  schema,
  stageIndex,
  onStageChange,
}: {
  schema: ServiceSchema;
  stageIndex: number;
  onStageChange: (i: number) => void;
}) {
  const [data, setData] = useState<FormData>({});
  const stage = schema.stages[Math.min(stageIndex, schema.stages.length - 1)];
  const steps = visibleSteps(stage, data);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-center gap-2 text-[12px] font-bold text-slate-400">
        <MonitorSmartphone size={14} />
        Предпросмотр — так услугу увидит предприниматель. Поля интерактивны: проверьте ветвления и расчёты.
      </div>
      {schema.stages.length > 1 && (
        <div className="mb-4 flex justify-center gap-2">
          {schema.stages.map((st, i) => (
            <button
              key={st.id}
              onClick={() => onStageChange(i)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-extrabold transition ${
                i === stageIndex ? "bg-brand-800 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              {st.title}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-5">
        {steps.map((step, i) => (
          <section key={step.id} className="card p-6">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-brand-400">Шаг {i + 1}</div>
            <h3 className="mt-0.5 text-[18px] font-extrabold text-brand-950">{step.title}</h3>
            {step.description && <p className="mt-1 text-[13px] text-slate-500">{step.description}</p>}
            <div className="mt-4 space-y-4">
              {visibleFields(step, data).map((f) => (
                <FieldInput
                  key={f.id}
                  field={f}
                  data={data}
                  onChange={(id, v) => setData((d) => ({ ...d, [id]: v }))}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
