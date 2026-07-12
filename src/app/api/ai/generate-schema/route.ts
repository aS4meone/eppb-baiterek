import { NextRequest, NextResponse } from "next/server";
import { askLLM, hasLLM } from "@/lib/ai";
import type { ServiceSchema } from "@/lib/engine/types";

/**
 * AI-помощник автора услуги: превращает текстовое описание меры поддержки
 * (условия программы, НПА, регламент) в черновик JSON-схемы формы
 * с шагами, полями, ветвлением и расчётами.
 */
export async function POST(req: NextRequest) {
  const { description } = await req.json();
  if (!description) return NextResponse.json({ error: "Пустое описание" }, { status: 400 });

  if (hasLLM()) {
    const system = `Ты — генератор схем форм для конструктора госуслуг ЕППБ (Казахстан).
Из описания меры поддержки построй JSON-схему анкеты.

Формат (строго JSON, без пояснений):
{"stages":[{"id":"main","title":"Заявка","steps":[{"id":"s1","title":"...","fields":[...]}]}]}

Типы полей: text, textarea, number, money, select, radio, checkbox, date, iin, bin, phone, email, file, calc, info.
Поле: {"id":"snake_case","type":"...","label":"...","required":true,"hint":"..."}.
select/radio: +"options":[{"value":"...","label":"..."}].
Ветвление: +"condition":{"field":"id","op":"eq","value":"..."} (op: eq|ne|gt|lt|in|notEmpty).
Расчёт: type calc +"formula":"amount * 0.2" (id других полей), +"unit":"тенге".
Подсказка-блок: type info +"content":"...".
Разбей длинную анкету на 2-4 шага по смыслу. Скрывай нерелевантные поля условиями. Добавь checkbox согласия в конце.
Если входной текст НЕ похож на описание услуги, меры поддержки или программы (бессмысленный набор символов, спам, посторонняя тема) — верни {"error":"not_a_service"}.`;

    const raw = await askLLM(system, description, 4096);
    if (raw) {
      try {
        const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
        if (parsed.error) {
          return NextResponse.json(
            { error: "Текст не похож на описание услуги. Вставьте условия программы поддержки: кто может получить, суммы, ставки, документы." },
            { status: 422 }
          );
        }
        const schema = sanitizeSchema(parsed);
        if (schema.stages.length) return NextResponse.json({ schema, engine: "llm" });
      } catch {}
    }
  }

  // Фолбэк без ключа: шаблонная схема-черновик по эвристикам
  return NextResponse.json({ schema: templateSchema(description), engine: "template" });
}

const FIELD_TYPES = new Set([
  "text", "textarea", "number", "money", "select", "radio", "checkbox",
  "date", "iin", "bin", "phone", "email", "file", "calc", "info",
]);

/**
 * Нормализация LLM-вывода: этап без steps (или с fields на верхнем уровне)
 * оборачивается в шаг, пустые этапы отбрасываются, неизвестные типы полей
 * приводятся к text, всем сущностям гарантируются id.
 */
function sanitizeSchema(raw: unknown): ServiceSchema {
  const src = (raw ?? {}) as Record<string, unknown>;
  const stagesRaw = Array.isArray(src.stages) ? src.stages : [src];
  let n = 0;
  const uid = (p: string) => `${p}_ai${(n++).toString(36)}`;

  const stages = stagesRaw
    .map((stRaw) => {
      const st = (stRaw ?? {}) as Record<string, unknown>;
      let steps = Array.isArray(st.steps) ? st.steps : [];
      if (!steps.length && Array.isArray(st.fields)) {
        steps = [{ id: uid("step"), title: String(st.title ?? "Данные"), fields: st.fields }];
      }
      const cleanSteps = steps
        .map((sRaw) => {
          const s = (sRaw ?? {}) as Record<string, unknown>;
          const fields = (Array.isArray(s.fields) ? s.fields : [])
            .map((fRaw) => {
              const f = { ...(fRaw as Record<string, unknown>) };
              if (!f.id || typeof f.id !== "string") f.id = uid("f");
              if (!FIELD_TYPES.has(String(f.type))) f.type = "text";
              if (typeof f.label !== "string") f.label = "";
              return f;
            });
          return { id: String(s.id ?? uid("step")), title: String(s.title ?? "Шаг"), description: s.description ? String(s.description) : undefined, fields };
        })
        .filter((s) => s.fields.length > 0);
      return { id: String(st.id ?? uid("stage")), title: String(st.title ?? "Заявка"), description: st.description ? String(st.description) : undefined, steps: cleanSteps };
    })
    .filter((st) => st.steps.length > 0);

  return { stages } as unknown as ServiceSchema;
}

function templateSchema(description: string): ServiceSchema {
  const d = description.toLowerCase();
  const money = /кредит|заем|займ|финансирован|лизинг|сумм/.test(d);
  const docs = /документ|справк|отчетност|отчётност/.test(d);

  return {
    stages: [
      {
        id: "main",
        title: "Заявка",
        steps: [
          {
            id: "applicant",
            title: "Заявитель",
            fields: [
              {
                id: "applicant_type", type: "radio", label: "Тип заявителя", required: true,
                options: [
                  { value: "legal", label: "Юридическое лицо" },
                  { value: "ip", label: "Индивидуальный предприниматель" },
                ],
              },
              { id: "bin", type: "bin", label: "БИН", required: true, condition: { field: "applicant_type", op: "eq", value: "legal" } },
              { id: "iin", type: "iin", label: "ИИН", required: true, condition: { field: "applicant_type", op: "eq", value: "ip" } },
              { id: "phone", type: "phone", label: "Телефон", required: true },
              { id: "email", type: "email", label: "E-mail", required: true },
            ],
          },
          {
            id: "details",
            title: "Параметры",
            fields: [
              ...(money
                ? [
                    { id: "amount", type: "money" as const, label: "Запрашиваемая сумма", required: true, unit: "тенге" },
                    { id: "term", type: "number" as const, label: "Срок, месяцев", required: true, min: 1, max: 120 },
                  ]
                : [{ id: "subject", type: "textarea" as const, label: "Суть обращения", required: true }]),
              ...(docs ? [{ id: "doc_main", type: "file" as const, label: "Подтверждающий документ", required: true, accept: ".pdf" }] : []),
              { id: "consent", type: "checkbox", label: "Согласие на обработку данных", required: true },
            ],
          },
        ],
      },
    ],
  };
}
