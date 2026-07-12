"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Eye,
  Layers,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import type { Field, FieldType, Service, ServiceSchema, Stage, Step } from "@/lib/engine/types";
import { FieldEditor } from "./field-editor";
import { SchemaPreview } from "./preview";

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: "text", label: "Строка" },
  { type: "textarea", label: "Текст" },
  { type: "number", label: "Число" },
  { type: "money", label: "Деньги" },
  { type: "select", label: "Список" },
  { type: "radio", label: "Выбор" },
  { type: "checkbox", label: "Чекбокс" },
  { type: "date", label: "Дата" },
  { type: "iin", label: "ИИН" },
  { type: "bin", label: "БИН" },
  { type: "phone", label: "Телефон" },
  { type: "email", label: "E-mail" },
  { type: "file", label: "Документ" },
  { type: "calc", label: "Расчёт" },
  { type: "info", label: "Инфоблок" },
];

let uid = 0;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(uid++).toString(36)}`;

/**
 * Конструктор услуги: метаданные + дерево схемы (этапы → шаги → поля) +
 * панель свойств поля + живой предпросмотр. Работает с той же JSON-схемой,
 * которую рендерит клиентский wizard.
 */
export function Builder({ initial }: { initial: Service }) {
  const router = useRouter();
  const [meta, setMeta] = useState({
    code: initial.code,
    title: initial.title,
    summary: initial.summary,
    description: initial.description,
    category: initial.category,
    direction: initial.direction,
    organization: initial.organization,
  });
  const [schema, setSchema] = useState<ServiceSchema>(initial.schema);
  const [stageIdx, setStageIdx] = useState(0);
  const [sel, setSel] = useState<{ step: number; field: number } | null>(null);
  const [tab, setTab] = useState<"builder" | "preview">("builder");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const stage = schema.stages[stageIdx];
  const allFieldIds = useMemo(
    () => schema.stages.flatMap((st) => st.steps.flatMap((s) => s.fields.map((f) => ({ id: f.id, label: f.label })))),
    [schema]
  );

  /* ---------- мутации схемы ---------- */

  function patchStage(idx: number, patch: Partial<Stage>) {
    setSchema((s) => ({
      stages: s.stages.map((st, i) => (i === idx ? { ...st, ...patch } : st)),
    }));
  }

  function patchStep(stepIdx: number, patch: Partial<Step>) {
    patchStage(stageIdx, {
      steps: stage.steps.map((s, i) => (i === stepIdx ? { ...s, ...patch } : s)),
    });
  }

  function patchField(stepIdx: number, fieldIdx: number, next: Field) {
    patchStep(stepIdx, {
      fields: stage.steps[stepIdx].fields.map((f, i) => (i === fieldIdx ? next : f)),
    });
  }

  function addStage() {
    setSchema((s) => ({
      stages: [...s.stages, { id: newId("stage"), title: `Этап ${s.stages.length + 1}`, steps: [{ id: newId("step"), title: "Новый шаг", fields: [] }] }],
    }));
    setStageIdx(schema.stages.length);
    setSel(null);
  }

  function addStep() {
    patchStage(stageIdx, {
      steps: [...stage.steps, { id: newId("step"), title: `Шаг ${stage.steps.length + 1}`, fields: [] }],
    });
  }

  function addField(stepIdx: number, type: FieldType) {
    const field: Field = {
      id: newId("f"),
      type,
      label:
        type === "info" ? "" : type === "calc" ? "Расчётное значение" : "Новое поле",
      required: type !== "info" && type !== "calc",
      ...(type === "select" || type === "radio"
        ? { options: [{ value: "opt1", label: "Вариант 1" }, { value: "opt2", label: "Вариант 2" }] }
        : {}),
      ...(type === "calc" ? { formula: "" } : {}),
      ...(type === "info" ? { content: "Текст подсказки" } : {}),
    };
    patchStep(stepIdx, { fields: [...stage.steps[stepIdx].fields, field] });
    setSel({ step: stepIdx, field: stage.steps[stepIdx].fields.length });
  }

  function moveField(stepIdx: number, fieldIdx: number, dir: -1 | 1) {
    const fields = [...stage.steps[stepIdx].fields];
    const j = fieldIdx + dir;
    if (j < 0 || j >= fields.length) return;
    [fields[fieldIdx], fields[j]] = [fields[j], fields[fieldIdx]];
    patchStep(stepIdx, { fields });
    setSel({ step: stepIdx, field: j });
  }

  function removeField(stepIdx: number, fieldIdx: number) {
    patchStep(stepIdx, { fields: stage.steps[stepIdx].fields.filter((_, i) => i !== fieldIdx) });
    setSel(null);
  }

  function duplicateField(stepIdx: number, fieldIdx: number) {
    const src = stage.steps[stepIdx].fields[fieldIdx];
    const copy = { ...JSON.parse(JSON.stringify(src)), id: newId("f") };
    const fields = [...stage.steps[stepIdx].fields];
    fields.splice(fieldIdx + 1, 0, copy);
    patchStep(stepIdx, { fields });
  }

  function removeStep(stepIdx: number) {
    if (stage.steps.length <= 1) return;
    patchStage(stageIdx, { steps: stage.steps.filter((_, i) => i !== stepIdx) });
    setSel(null);
  }

  /* ---------- сохранение ---------- */

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/services/${initial.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...meta, schema }),
    });
    setSavedAt(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    setSaving(false);
    router.refresh();
  }

  const selField = sel ? stage.steps[sel.step]?.fields[sel.field] : null;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* Шапка конструктора */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin" className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-400 hover:text-brand-600">
          <ArrowLeft size={14} /> Админ-кабинет
        </Link>
        <span className="text-slate-300">/</span>
        <input
          value={meta.title}
          onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
          className="min-w-64 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-[18px] font-extrabold text-brand-950 outline-none transition hover:border-slate-200 focus:border-brand-400 focus:bg-white"
        />
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600">
              <Check size={13} /> Сохранено {savedAt}
            </span>
          )}
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-[12.5px] font-extrabold text-violet-700 transition hover:bg-violet-100"
          >
            <Wand2 size={15} /> Сгенерировать AI
          </button>
          <div className="flex overflow-hidden rounded-xl border border-slate-200">
            <TabBtn active={tab === "builder"} onClick={() => setTab("builder")} icon={Layers} label="Конструктор" />
            <TabBtn active={tab === "preview"} onClick={() => setTab("preview")} icon={Eye} label="Предпросмотр" />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-800 px-5 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Сохранить
          </button>
        </div>
      </div>

      {/* Метаданные */}
      <div className="mt-4 grid gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <MetaInput label="Код услуги" value={meta.code} onChange={(v) => setMeta((m) => ({ ...m, code: v }))} />
        <MetaInput label="Категория" value={meta.category} onChange={(v) => setMeta((m) => ({ ...m, category: v }))} />
        <MetaInput label="Направление" value={meta.direction} onChange={(v) => setMeta((m) => ({ ...m, direction: v }))} />
        <MetaInput label="Организация-оператор" value={meta.organization} onChange={(v) => setMeta((m) => ({ ...m, organization: v }))} />
        <div className="sm:col-span-4">
          <MetaInput label="Краткое описание (для карточки в каталоге)" value={meta.summary} onChange={(v) => setMeta((m) => ({ ...m, summary: v }))} />
        </div>
      </div>

      {tab === "preview" ? (
        <div className="mt-6">
          <SchemaPreview schema={schema} stageIndex={stageIdx} onStageChange={setStageIdx} />
        </div>
      ) : (
        <>
          {/* Этапы */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {schema.stages.map((st, i) => (
              <button
                key={st.id}
                onClick={() => {
                  setStageIdx(i);
                  setSel(null);
                }}
                className={`rounded-xl px-4 py-2 text-[12.5px] font-extrabold transition ${
                  i === stageIdx ? "bg-brand-800 text-white shadow-sm" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-brand-300"
                }`}
              >
                {st.title}
              </button>
            ))}
            <button
              onClick={addStage}
              className="flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-[12px] font-bold text-slate-400 transition hover:border-brand-400 hover:text-brand-600"
            >
              <Plus size={13} /> Этап
            </button>
            {stageIdx > 0 && (
              <button
                onClick={() => {
                  setSchema((s) => ({ stages: s.stages.filter((_, i) => i !== stageIdx) }));
                  setStageIdx(0);
                  setSel(null);
                }}
                className="ml-1 flex items-center gap-1 rounded-xl px-3 py-2 text-[12px] font-bold text-red-400 transition hover:bg-red-50"
              >
                <Trash2 size={13} /> Удалить этап
              </button>
            )}
            <input
              value={stage.title}
              onChange={(e) => patchStage(stageIdx, { title: e.target.value })}
              className="ml-auto w-72 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-bold text-slate-700 outline-none focus:border-brand-400"
              placeholder="Название этапа"
            />
          </div>

          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_380px]">
            {/* Дерево шагов и полей */}
            <div className="space-y-4">
              {stage.steps.map((step, si) => (
                <div key={step.id} className="card p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-[12px] font-extrabold text-brand-700">
                      {si + 1}
                    </span>
                    <input
                      value={step.title}
                      onChange={(e) => patchStep(si, { title: e.target.value })}
                      className="flex-1 rounded-lg border border-transparent px-2 py-1 text-[15px] font-extrabold text-brand-950 outline-none transition hover:border-slate-200 focus:border-brand-400"
                    />
                    <button
                      onClick={() => removeStep(si)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                      title="Удалить шаг"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {step.fields.map((f, fi) => {
                      const isSel = sel?.step === si && sel?.field === fi;
                      return (
                        <div
                          key={f.id}
                          onClick={() => setSel({ step: si, field: fi })}
                          className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                            isSel ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-slate-150 border-slate-200 bg-white hover:border-brand-200"
                          }`}
                        >
                          <span className="w-16 shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-extrabold uppercase text-slate-500">
                            {FIELD_TYPES.find((t) => t.type === f.type)?.label ?? f.type}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-700">
                            {f.label || (f.type === "info" ? (f.content ?? "").slice(0, 60) : f.id)}
                            {f.required && <span className="text-red-400"> *</span>}
                          </span>
                          {f.condition && (
                            <span className="shrink-0 rounded-md bg-violet-50 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase text-violet-600" title="Условная видимость">
                              если
                            </span>
                          )}
                          {f.formula && (
                            <span className="shrink-0 rounded-md bg-gold-100 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase text-gold-600" title="Формула">
                              ƒx
                            </span>
                          )}
                          <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                            <IconBtn onClick={(e) => { e.stopPropagation(); moveField(si, fi, -1); }} title="Вверх"><ArrowUp size={13} /></IconBtn>
                            <IconBtn onClick={(e) => { e.stopPropagation(); moveField(si, fi, 1); }} title="Вниз"><ArrowDown size={13} /></IconBtn>
                            <IconBtn onClick={(e) => { e.stopPropagation(); duplicateField(si, fi); }} title="Дублировать"><Copy size={13} /></IconBtn>
                            <IconBtn danger onClick={(e) => { e.stopPropagation(); removeField(si, fi); }} title="Удалить"><Trash2 size={13} /></IconBtn>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Палитра типов */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {FIELD_TYPES.map((t) => (
                      <button
                        key={t.type}
                        onClick={() => addField(si, t.type)}
                        className="rounded-lg border border-dashed border-slate-250 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
                      >
                        + {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={addStep}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-[13px] font-extrabold text-slate-400 transition hover:border-brand-300 hover:text-brand-600"
              >
                <Plus size={16} /> Добавить шаг
              </button>
            </div>

            {/* Панель свойств */}
            <aside>
              <div className="sticky top-24">
                {selField && sel ? (
                  <FieldEditor
                    key={selField.id}
                    field={selField}
                    allFields={allFieldIds}
                    onChange={(f) => patchField(sel.step, sel.field, f)}
                  />
                ) : (
                  <div className="card flex flex-col items-center p-10 text-center">
                    <Sparkles size={24} className="text-slate-300" />
                    <p className="mt-3 text-[13px] font-bold text-slate-500">Выберите поле слева</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                      Здесь настраиваются подпись, обязательность, подсказки, условия видимости и формулы.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </>
      )}

      {aiOpen && (
        <AiGenerateDialog
          onClose={() => setAiOpen(false)}
          onGenerated={(s) => {
            setSchema(s);
            setStageIdx(0);
            setSel(null);
            setAiOpen(false);
            setTab("builder");
          }}
        />
      )}
    </div>
  );
}

/* ---------- AI-диалог ---------- */

function AiGenerateDialog({ onClose, onGenerated }: { onClose: () => void; onGenerated: (s: ServiceSchema) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось сгенерировать схему");
        return;
      }
      if (data.schema) onGenerated(data.schema);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Wand2 size={19} />
          </span>
          <div>
            <h3 className="text-[17px] font-extrabold text-brand-950">AI-генерация схемы формы</h3>
            <p className="text-[12px] text-slate-500">Вставьте условия программы, регламент или описание услуги</p>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Например: Программа льготного кредитования переработчиков молока. Прямые заёмщики — ставка 6%, срок до 5 лет, сумма до 500 млн тенге. Требуется справка об отсутствии задолженности и бизнес-план для сумм свыше 100 млн…"
          className="mt-5 min-h-40 w-full rounded-xl border border-slate-200 p-4 text-[13px] leading-relaxed outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
        <p className="mt-2 text-[11.5px] leading-snug text-slate-400">
          AI построит шаги, поля, условия видимости и расчёты. Черновик заменит текущую схему — его можно доработать вручную.
        </p>
        {error && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] font-bold text-red-700">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-500 transition hover:bg-slate-100">
            Отмена
          </button>
          <button
            onClick={generate}
            disabled={loading || text.trim().length < 20}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? "Генерируем…" : "Сгенерировать схему"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- мелкие элементы ---------- */

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Eye; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-extrabold transition ${
        active ? "bg-brand-800 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function MetaInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-extrabold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-700 outline-none transition focus:border-brand-400"
      />
    </label>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-6.5 w-6.5 items-center justify-center rounded-md transition ${
        danger ? "text-slate-300 hover:bg-red-50 hover:text-red-500" : "text-slate-300 hover:bg-brand-50 hover:text-brand-600"
      }`}
    >
      {children}
    </button>
  );
}
