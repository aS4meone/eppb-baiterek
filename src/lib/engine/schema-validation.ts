import { z } from "zod";
import type { ServiceSchema } from "./types";

/**
 * Валидация JSON-схемы услуги перед записью в БД: битая схема из
 * конструктора или API не должна ронять опубликованную услугу.
 */

const conditionZ: z.ZodType = z.lazy(() =>
  z.union([
    z.object({
      field: z.string().min(1),
      op: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in", "notEmpty", "empty"]),
      value: z.unknown().optional(),
    }),
    z.object({ and: z.array(conditionZ).min(1) }),
    z.object({ or: z.array(conditionZ).min(1) }),
  ])
);

const fieldZ = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/i, "id поля: латиница/цифры/подчёркивание"),
  type: z.enum([
    "text", "textarea", "number", "money", "select", "radio", "checkbox",
    "date", "iin", "bin", "phone", "email", "file", "calc", "info",
  ]),
  label: z.string(),
  hint: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  condition: conditionZ.optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  reference: z.string().optional(),
  formula: z.string().optional(),
  prefill: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
  content: z.string().optional(),
  accept: z.string().optional(),
});

const stepZ = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  condition: conditionZ.optional(),
  fields: z.array(fieldZ),
});

const stageZ = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(stepZ).min(1),
});

export const serviceSchemaZ = z.object({
  stages: z.array(stageZ).min(1),
});

export function validateServiceSchema(raw: unknown): { ok: true; schema: ServiceSchema } | { ok: false; error: string } {
  const res = serviceSchemaZ.safeParse(raw);
  if (!res.success) {
    const first = res.error.issues[0];
    return { ok: false, error: `Схема некорректна: ${first.path.join(".")} — ${first.message}` };
  }
  // уникальность id полей — на них ссылаются условия и формулы
  const ids = res.data.stages.flatMap((st) => st.steps.flatMap((s) => s.fields.map((f) => f.id)));
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) return { ok: false, error: `Дублируется id поля «${dup}»` };
  return { ok: true, schema: res.data as ServiceSchema };
}
