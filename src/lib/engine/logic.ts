/**
 * Движок логики схемы: условия видимости и расчётные формулы.
 * Формулы вычисляются собственным безопасным парсером (без eval/Function):
 * поддерживаются + - * / ( ), числа, идентификаторы полей и функции
 * min, max, round, floor, ceil, abs.
 */
import type { Condition, Field, ServiceSchema, Stage, Step } from "./types";

export type FormData = Record<string, unknown>;

export function evalCondition(cond: Condition | undefined, data: FormData): boolean {
  if (!cond) return true;
  if ("and" in cond) return cond.and.every((c) => evalCondition(c, data));
  if ("or" in cond) return cond.or.some((c) => evalCondition(c, data));

  const raw = data[cond.field];
  const val = typeof raw === "string" && raw.trim() !== "" && !isNaN(Number(raw)) ? Number(raw) : raw;
  const target =
    typeof cond.value === "string" && cond.value.trim() !== "" && !isNaN(Number(cond.value))
      ? Number(cond.value)
      : cond.value;

  switch (cond.op) {
    case "eq":
      return val === target || String(raw ?? "") === String(cond.value ?? "");
    case "ne":
      return !(val === target || String(raw ?? "") === String(cond.value ?? ""));
    case "gt":
      return Number(val) > Number(target);
    case "gte":
      return Number(val) >= Number(target);
    case "lt":
      return Number(val) < Number(target);
    case "lte":
      return Number(val) <= Number(target);
    case "in":
      return Array.isArray(cond.value) && cond.value.map(String).includes(String(raw ?? ""));
    case "notEmpty":
      return raw !== undefined && raw !== null && String(raw).trim() !== "";
    case "empty":
      return raw === undefined || raw === null || String(raw).trim() === "";
    default:
      return true;
  }
}

/* ---------- Формулы: лексер + рекурсивный спуск ---------- */

type Token =
  | { kind: "num"; value: number }
  | { kind: "id"; name: string }
  | { kind: "op"; ch: string };

const FUNCS: Record<string, (...a: number[]) => number> = {
  min: Math.min,
  max: Math.max,
  round: (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d,
  floor: Math.floor,
  ceil: Math.ceil,
  abs: Math.abs,
};

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9._]/.test(src[j])) j++;
      tokens.push({ kind: "num", value: Number(src.slice(i, j).replace(/_/g, "")) });
      i = j;
    } else if (/[a-zA-Z_а-яА-Я]/.test(ch)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9_а-яА-Я]/.test(src[j])) j++;
      tokens.push({ kind: "id", name: src.slice(i, j) });
      i = j;
    } else if ("+-*/(),%".includes(ch)) {
      tokens.push({ kind: "op", ch });
      i++;
    } else {
      throw new Error(`Недопустимый символ в формуле: ${ch}`);
    }
  }
  return tokens;
}

export function evalFormula(formula: string, data: FormData): number | null {
  try {
    const tokens = tokenize(formula);
    let pos = 0;

    const peek = () => tokens[pos];
    const next = () => tokens[pos++];
    const expectOp = (ch: string) => {
      const t = next();
      if (!t || t.kind !== "op" || t.ch !== ch) throw new Error(`Ожидался «${ch}»`);
    };

    function primary(): number {
      const t = next();
      if (!t) throw new Error("Неожиданный конец формулы");
      if (t.kind === "num") return t.value;
      if (t.kind === "op" && t.ch === "(") {
        const v = expr();
        expectOp(")");
        return v;
      }
      if (t.kind === "op" && t.ch === "-") return -primary();
      if (t.kind === "id") {
        const p = peek();
        if (p && p.kind === "op" && p.ch === "(") {
          next();
          const args: number[] = [];
          if (!(peek()?.kind === "op" && (peek() as { ch: string }).ch === ")")) {
            args.push(expr());
            while (peek()?.kind === "op" && (peek() as { ch: string }).ch === ",") {
              next();
              args.push(expr());
            }
          }
          expectOp(")");
          const fn = FUNCS[t.name];
          if (!fn) throw new Error(`Неизвестная функция ${t.name}`);
          return fn(...args);
        }
        const raw = data[t.name];
        const num = Number(raw);
        return isNaN(num) ? 0 : num;
      }
      throw new Error("Ошибка разбора формулы");
    }

    function term(): number {
      let v = primary();
      while (peek()?.kind === "op" && "*/%".includes((peek() as { ch: string }).ch)) {
        const op = (next() as { ch: string }).ch;
        const r = primary();
        v = op === "*" ? v * r : op === "/" ? v / r : v % r;
      }
      return v;
    }

    function expr(): number {
      let v = term();
      while (peek()?.kind === "op" && "+-".includes((peek() as { ch: string }).ch)) {
        const op = (next() as { ch: string }).ch;
        const r = term();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    }

    const result = expr();
    if (pos !== tokens.length) throw new Error("Лишние символы в формуле");
    return isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/* ---------- Видимость и валидация ---------- */

export function visibleSteps(stage: Stage, data: FormData): Step[] {
  return stage.steps.filter((s) => evalCondition(s.condition, data));
}

export function visibleFields(step: Step, data: FormData): Field[] {
  return step.fields.filter((f) => evalCondition(f.condition, data));
}

export function validateField(field: Field, data: FormData): string | null {
  const raw = data[field.id];
  const empty = raw === undefined || raw === null || String(raw).trim() === "";

  if (field.required && field.type !== "info" && field.type !== "calc" && empty) {
    return "Обязательное поле";
  }
  if (empty) return null;

  const s = String(raw).trim();
  switch (field.type) {
    case "iin":
      if (!/^\d{12}$/.test(s)) return "ИИН должен состоять из 12 цифр";
      break;
    case "bin":
      if (!/^\d{12}$/.test(s)) return "БИН должен состоять из 12 цифр";
      break;
    case "email":
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) return "Некорректный e-mail";
      break;
    case "phone":
      if (!/^\+?[\d\s()-]{10,15}$/.test(s)) return "Некорректный номер телефона";
      break;
    case "number":
    case "money": {
      const n = Number(s.replace(/\s/g, ""));
      if (isNaN(n)) return "Введите число";
      if (field.min !== undefined && n < field.min) return `Не менее ${field.min.toLocaleString("ru-RU")}`;
      if (field.max !== undefined && n > field.max) return `Не более ${field.max.toLocaleString("ru-RU")}`;
      break;
    }
  }
  return null;
}

export function validateStep(step: Step, data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of visibleFields(step, data)) {
    const e = validateField(f, data);
    if (e) errors[f.id] = e;
  }
  return errors;
}

/** Прогресс заполнения этапа: [заполнено, всего обязательных видимых] */
export function stageProgress(stage: Stage, data: FormData): [number, number] {
  let filled = 0;
  let total = 0;
  for (const step of visibleSteps(stage, data)) {
    for (const f of visibleFields(step, data)) {
      if (f.type === "info" || f.type === "calc" || !f.required) continue;
      total++;
      const raw = data[f.id];
      if (raw !== undefined && raw !== null && String(raw).trim() !== "") filled++;
    }
  }
  return [filled, total];
}

export function allFields(schema: ServiceSchema): Field[] {
  return schema.stages.flatMap((st) => st.steps.flatMap((s) => s.fields));
}
