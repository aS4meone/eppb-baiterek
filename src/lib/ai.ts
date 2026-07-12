import { listServices } from "./repo";
import type { Service } from "./engine/types";

/**
 * AI-слой ЕППБ. Провайдеры по приоритету:
 *  1. OpenAI (OPENAI_API_KEY, gpt-4o-mini) — основной для демо;
 *  2. Anthropic Claude (ANTHROPIC_API_KEY) — альтернативный;
 *  3. rule-based фолбэк — демо работает даже без ключей.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export function hasLLM(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export async function askLLM(system: string, user: string, maxTokens = 1024): Promise<string | null> {
  if (process.env.OPENAI_API_KEY) {
    const r = await askOpenAI(system, user, maxTokens);
    if (r) return r;
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return askClaude(system, user, maxTokens);
  }
  return null;
}

async function askOpenAI(system: string, user: string, maxTokens: number): Promise<string | null> {
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function askClaude(system: string, user: string, maxTokens: number): Promise<string | null> {
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

/* ---------- rule-based подбор услуги (фолбэк) ---------- */

const KEYWORDS: { service: string; words: string[] }[] = [
  { service: "wagons_leasing", words: ["вагон", "жд", "ж/д", "железнодорож", "локомотив", "цистерн", "полувагон", "платформ", "перевозк"] },
  { service: "agro_animal", words: ["скот", "крс", "птиц", "откорм", "животновод", "ферма", "корм", "молодняк", "куриц"] },
  { service: "kaf_machinery", words: ["трактор", "комбайн", "сельхозтехник", "посевн", "уборочн", "навесн"] },
  { service: "damu_guarantee", words: ["залог", "гаранти", "обеспечен", "кредит без залога", "недостаточно залога"] },
  { service: "kazakhexport_insurance", words: ["экспорт", "зарубеж", "иностранн", "контракт", "неплатеж", "покупатель"] },
  { service: "otbasy_housing", words: ["жиль", "квартир", "ипотек", "накоплен", "дом"] },
  { service: "kdb_investment", words: ["завод", "производств", "инвестиционн", "крупн", "промышленн", "инфраструктур"] },
  { service: "qic_venture", words: ["стартап", "венчур", "it", "ит-", "приложен", "инвестор", "раунд"] },
];

export function ruleBasedMatch(query: string): { services: Service[]; note: string } {
  const q = query.toLowerCase();
  const all = listServices();
  const scored = KEYWORDS
    .map((k) => ({ code: k.service, score: k.words.filter((w) => q.includes(w)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const services = scored
    .map((s) => all.find((x) => x.code === s.code))
    .filter((x): x is Service => Boolean(x))
    .slice(0, 3);

  if (services.length === 0) {
    return {
      services: all.filter((s) => s.isPopular).slice(0, 3),
      note: "Точного совпадения не нашлось — вот популярные меры поддержки. Уточните: что хотите профинансировать и в какой отрасли работаете?",
    };
  }
  return {
    services,
    note: "По вашему описанию подходят эти меры поддержки:",
  };
}

export function servicesContext(): string {
  return listServices()
    .map(
      (s) =>
        `- code: ${s.code} | «${s.title}» (${s.organization}). ${s.summary} Условия: ${s.conditions.map((c) => `${c.title}: ${c.value}`).join(", ")}. Кому: ${s.audience.join(", ")}.`
    )
    .join("\n");
}
