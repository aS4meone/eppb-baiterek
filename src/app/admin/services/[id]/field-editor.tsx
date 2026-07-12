"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Condition, Field } from "@/lib/engine/types";

interface Props {
  field: Field;
  allFields: { id: string; label: string }[];
  onChange: (f: Field) => void;
}

/** Панель свойств поля: подпись, обязательность, варианты, условие, формула */
export function FieldEditor({ field, allFields, onChange }: Props) {
  const set = (patch: Partial<Field>) => onChange({ ...field, ...patch });
  const simpleCond = field.condition && !("and" in field.condition) && !("or" in field.condition) ? field.condition : null;

  return (
    <div className="card max-h-[calc(100vh-130px)] space-y-4 overflow-y-auto p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-extrabold text-brand-950">Свойства поля</h3>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-extrabold uppercase text-slate-500">{field.type}</span>
      </div>

      {field.type !== "info" && (
        <Prop label="Подпись">
          <input className={inp} value={field.label} onChange={(e) => set({ label: e.target.value })} />
        </Prop>
      )}

      <Prop label="Идентификатор (для условий и формул)">
        <input className={`${inp} font-mono`} value={field.id} onChange={(e) => set({ id: e.target.value.replace(/[^a-z0-9_]/g, "") })} />
      </Prop>

      {field.type === "info" && (
        <Prop label="Текст подсказки (**жирный**)">
          <textarea className={`${inp} min-h-24`} value={field.content ?? ""} onChange={(e) => set({ content: e.target.value })} />
        </Prop>
      )}

      {field.type !== "info" && field.type !== "calc" && (
        <label className="flex items-center gap-2.5 text-[13px] font-bold text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-700"
            checked={Boolean(field.required)}
            onChange={(e) => set({ required: e.target.checked })}
          />
          Обязательное поле
        </label>
      )}

      {field.type !== "info" && (
        <Prop label="Подсказка под полем">
          <input className={inp} value={field.hint ?? ""} onChange={(e) => set({ hint: e.target.value || undefined })} />
        </Prop>
      )}

      {(field.type === "text" || field.type === "textarea" || field.type === "phone" || field.type === "email") && (
        <Prop label="Placeholder">
          <input className={inp} value={field.placeholder ?? ""} onChange={(e) => set({ placeholder: e.target.value || undefined })} />
        </Prop>
      )}

      {(field.type === "number" || field.type === "money") && (
        <div className="grid grid-cols-3 gap-2">
          <Prop label="Мин.">
            <input className={inp} inputMode="numeric" value={field.min ?? ""} onChange={(e) => set({ min: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </Prop>
          <Prop label="Макс.">
            <input className={inp} inputMode="numeric" value={field.max ?? ""} onChange={(e) => set({ max: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </Prop>
          <Prop label="Ед. изм.">
            <input className={inp} value={field.unit ?? ""} onChange={(e) => set({ unit: e.target.value || undefined })} />
          </Prop>
        </div>
      )}

      {(field.type === "select" || field.type === "radio") && (
        <Prop label="Варианты">
          <div className="space-y-1.5">
            {(field.options ?? []).map((o, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  className={`${inp} w-24 font-mono text-[11px]`}
                  value={o.value}
                  onChange={(e) => {
                    const options = [...(field.options ?? [])];
                    options[i] = { ...o, value: e.target.value };
                    set({ options });
                  }}
                />
                <input
                  className={inp}
                  value={o.label}
                  onChange={(e) => {
                    const options = [...(field.options ?? [])];
                    options[i] = { ...o, label: e.target.value };
                    set({ options });
                  }}
                />
                <button
                  onClick={() => set({ options: (field.options ?? []).filter((_, j) => j !== i) })}
                  className="shrink-0 text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => set({ options: [...(field.options ?? []), { value: `opt${(field.options?.length ?? 0) + 1}`, label: "Новый вариант" }] })}
              className="flex items-center gap-1 text-[11.5px] font-bold text-brand-600 hover:text-brand-800"
            >
              <Plus size={12} /> Добавить вариант
            </button>
          </div>
        </Prop>
      )}

      {field.type === "calc" && (
        <Prop label="Формула (id полей, + − × ÷, min/max/round)">
          <input
            className={`${inp} font-mono text-[11.5px]`}
            placeholder="round(units * unit_price * 0.2)"
            value={field.formula ?? ""}
            onChange={(e) => set({ formula: e.target.value })}
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {allFields.filter((f) => f.id !== field.id).slice(0, 8).map((f) => (
              <button
                key={f.id}
                onClick={() => set({ formula: `${field.formula ?? ""}${field.formula ? " " : ""}${f.id}` })}
                title={f.label}
                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 hover:bg-brand-50 hover:text-brand-700"
              >
                {f.id}
              </button>
            ))}
          </div>
        </Prop>
      )}

      {field.type === "file" && (
        <Prop label="Допустимые форматы">
          <input className={inp} placeholder=".pdf,.docx" value={field.accept ?? ""} onChange={(e) => set({ accept: e.target.value || undefined })} />
        </Prop>
      )}

      <Prop label="Предзаполнение из профиля">
        <select className={inp} value={field.prefill ?? ""} onChange={(e) => set({ prefill: e.target.value || undefined })}>
          <option value="">— нет —</option>
          <option value="user.name">ФИО пользователя (eGov)</option>
          <option value="user.iin">ИИН пользователя (eGov)</option>
          <option value="company.name">Наименование компании (ГБД ЮЛ)</option>
          <option value="company.bin">БИН компании (ГБД ЮЛ)</option>
          <option value="company.region">Регион компании</option>
        </select>
      </Prop>

      {/* Условная видимость */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-violet-600">Показывать при условии</span>
          {field.condition ? (
            <button onClick={() => set({ condition: undefined })} className="text-[11px] font-bold text-slate-400 hover:text-red-500">
              Убрать
            </button>
          ) : (
            <button
              onClick={() => set({ condition: { field: allFields[0]?.id ?? "", op: "eq", value: "" } })}
              className="text-[11px] font-bold text-violet-600 hover:text-violet-800"
            >
              + Добавить
            </button>
          )}
        </div>
        {simpleCond && (
          <div className="mt-2.5 space-y-1.5">
            <select
              className={inp}
              value={simpleCond.field}
              onChange={(e) => set({ condition: { ...simpleCond, field: e.target.value } as Condition })}
            >
              {allFields.filter((f) => f.id !== field.id).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label || f.id}
                </option>
              ))}
            </select>
            <div className="flex gap-1.5">
              <select
                className={`${inp} w-32`}
                value={simpleCond.op}
                onChange={(e) => set({ condition: { ...simpleCond, op: e.target.value } as Condition })}
              >
                <option value="eq">равно</option>
                <option value="ne">не равно</option>
                <option value="gt">больше</option>
                <option value="lt">меньше</option>
                <option value="in">одно из</option>
                <option value="notEmpty">заполнено</option>
              </select>
              {simpleCond.op !== "notEmpty" && simpleCond.op !== "empty" && (
                <input
                  className={inp}
                  placeholder={simpleCond.op === "in" ? "a, b, c" : "значение"}
                  value={Array.isArray(simpleCond.value) ? simpleCond.value.join(", ") : String(simpleCond.value ?? "")}
                  onChange={(e) =>
                    set({
                      condition: {
                        ...simpleCond,
                        value: simpleCond.op === "in" ? e.target.value.split(",").map((s) => s.trim()) : e.target.value,
                      } as Condition,
                    })
                  }
                />
              )}
            </div>
          </div>
        )}
        {field.condition && !simpleCond && (
          <p className="mt-2 text-[11px] leading-snug text-slate-500">
            Составное условие (and/or) — редактируется в JSON-режиме схемы.
          </p>
        )}
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12.5px] text-slate-700 outline-none transition focus:border-brand-400";

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10.5px] font-extrabold uppercase tracking-wide text-slate-400">{label}</div>
      {children}
    </div>
  );
}
