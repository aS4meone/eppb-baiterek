"use client";

import { useEffect, useState } from "react";
import { Calculator, CheckCircle2, FileUp, Info, Loader2, Sparkles } from "lucide-react";
import type { Field } from "@/lib/engine/types";
import { evalFormula, type FormData } from "@/lib/engine/logic";
import { formatMoney } from "@/lib/format";

interface Props {
  field: Field;
  data: FormData;
  error?: string;
  options?: { value: string; label: string }[];
  onChange: (id: string, value: unknown) => void;
  /** Название услуги — контекст для AI-подсказки по полю */
  serviceTitle?: string;
}

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

/** Универсальный рендерер поля схемы. Ни одно поле не захардкожено под услугу. */
export function FieldInput({ field, data, error, options, onChange, serviceTitle }: Props) {
  const value = data[field.id];
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  async function explain() {
    if (explanation) {
      setExplanation(null);
      return;
    }
    setExplaining(true);
    try {
      const res = await fetch("/api/ai/explain-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceTitle,
          label: field.label,
          hint: field.hint,
          type: field.type,
          options: (field.options ?? options)?.map((o) => o.label),
        }),
      });
      const d = await res.json();
      setExplanation(d.explanation ?? null);
    } finally {
      setExplaining(false);
    }
  }

  if (field.type === "info") {
    return (
      <div className="flex gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-[13.5px] leading-relaxed text-brand-800">
        <Info size={17} className="mt-0.5 shrink-0 text-brand-500" />
        <div className="rich" dangerouslySetInnerHTML={{ __html: mdLite(field.content ?? "") }} />
      </div>
    );
  }

  if (field.type === "calc") {
    const result = field.formula ? evalFormula(field.formula, data) : null;
    return (
      <div className="flex items-center justify-between rounded-xl border border-gold-300 bg-gold-100/50 px-4 py-3">
        <div className="flex items-center gap-2.5 text-[13.5px] font-semibold text-brand-900">
          <Calculator size={16} className="text-gold-600" />
          {field.label}
        </div>
        <div className="text-[15px] font-extrabold tabular-nums text-brand-900">
          {result !== null ? formatMoney(result) : "—"}
          {field.unit && <span className="ml-1 text-[12px] font-semibold text-slate-500">{field.unit}</span>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="block text-[13px] font-bold text-slate-700">
          {field.type === "checkbox" ? "" : field.label}
          {field.type !== "checkbox" && field.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={explain}
          className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-slate-300 transition hover:bg-violet-50 hover:text-violet-600"
          title="AI объяснит, что вводить в это поле"
        >
          {explaining ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          Что это?
        </button>
      </div>
      <FieldControl field={field} value={value} data={data} options={options} onChange={onChange} />
      {explanation && (
        <div className="mt-2 flex gap-2 rounded-xl border border-violet-100 bg-violet-50/70 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-violet-900 animate-fade-up">
          <Sparkles size={13} className="mt-0.5 shrink-0 text-violet-500" />
          {explanation}
        </div>
      )}
      {field.hint && !error && !explanation && <p className="mt-1.5 text-[12px] leading-snug text-slate-500">{field.hint}</p>}
      {error && <p className="mt-1.5 text-[12px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function FieldControl({
  field,
  value,
  data,
  options,
  onChange,
}: Props & { value: unknown }) {
  const opts = field.options ?? options ?? [];

  switch (field.type) {
    case "radio":
      return (
        <div className="grid gap-2">
          {opts.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[13.5px] font-semibold transition ${
                value === o.value
                  ? "border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-200"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name={field.id}
                checked={value === o.value}
                onChange={() => onChange(field.id, o.value)}
              />
              <span
                className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                  value === o.value ? "border-brand-600" : "border-slate-300"
                }`}
              >
                {value === o.value && <span className="h-2 w-2 rounded-full bg-brand-600" />}
              </span>
              {o.label}
            </label>
          ))}
        </div>
      );

    case "select":
      return (
        <select
          className={inputBase}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
        >
          <option value="">— выберите —</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );

    case "checkbox":
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-snug text-slate-700 transition hover:border-brand-200">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-700"
            checked={Boolean(value)}
            onChange={(e) => onChange(field.id, e.target.checked)}
          />
          {field.label}
        </label>
      );

    case "textarea":
      return (
        <textarea
          className={`${inputBase} min-h-24 resize-y`}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );

    case "money":
    case "number":
      return (
        <div className="relative">
          <input
            className={`${inputBase} pr-16 tabular-nums`}
            inputMode="numeric"
            placeholder={field.placeholder ?? "0"}
            value={field.type === "money" && value ? formatMoney(Number(String(value).replace(/\s/g, ""))) : String(value ?? "")}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              onChange(field.id, raw === "" ? "" : Number(raw));
            }}
          />
          {field.unit && (
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[12.5px] font-semibold text-slate-400">
              {field.unit}
            </span>
          )}
        </div>
      );

    case "bin":
    case "iin":
      return <BinInput field={field} value={value} onChange={onChange} />;

    case "file":
      return <FileInput field={field} value={value} onChange={onChange} />;

    case "date":
      return (
        <input
          type="date"
          className={inputBase}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );

    default:
      return (
        <input
          className={inputBase}
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
  }
}

/** ИИН/БИН с автолукапом в мок-ГБД: демонстрация интеграционного взаимодействия */
function BinInput({ field, value, onChange }: { field: Field; value: unknown; onChange: Props["onChange"] }) {
  const [lookup, setLookup] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const v = String(value ?? "");

  useEffect(() => {
    if (!/^\d{12}$/.test(v)) {
      setLookup(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/integrations/registry?${field.type}=${v}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setLookup(d.found ? d : null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [v, field.type]);

  return (
    <div>
      <div className="relative">
        <input
          className={inputBase}
          inputMode="numeric"
          maxLength={12}
          placeholder="12 цифр"
          value={v}
          onChange={(e) => onChange(field.id, e.target.value.replace(/\D/g, "").slice(0, 12))}
        />
        {loading && <Loader2 size={16} className="absolute right-3.5 top-3 animate-spin text-brand-400" />}
      </div>
      {lookup && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
          <CheckCircle2 size={13} />
          {field.type === "bin" ? "ГБД «Юридические лица»" : "ГБД «Физические лица»"}: {lookup.name}
        </div>
      )}
    </div>
  );
}

/** Загрузка документа (имитация): файл фиксируется в заявке по имени */
function FileInput({ field, value, onChange }: { field: Field; value: unknown; onChange: Props["onChange"] }) {
  const name = typeof value === "string" ? value : null;
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 text-[13px] font-semibold transition ${
        name
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-slate-300 bg-slate-50 text-slate-500 hover:border-brand-300 hover:bg-brand-50"
      }`}
    >
      <input
        type="file"
        className="sr-only"
        accept={field.accept}
        onChange={(e) => onChange(field.id, e.target.files?.[0]?.name ?? "")}
      />
      {name ? <CheckCircle2 size={17} className="shrink-0" /> : <FileUp size={17} className="shrink-0" />}
      {name ? (
        <span>
          {name} <span className="font-normal text-emerald-600">— загружен</span>
        </span>
      ) : (
        <span>
          Загрузить файл{field.accept && <span className="font-normal text-slate-400"> ({field.accept})</span>}
        </span>
      )}
    </label>
  );
}

function mdLite(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}
