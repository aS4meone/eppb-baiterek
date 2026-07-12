import { NextRequest, NextResponse } from "next/server";
import { askLLM, hasLLM, ruleBasedMatch, servicesContext } from "@/lib/ai";
import { getService } from "@/lib/repo";

/**
 * AI-помощник предпринимателя: подбирает меру поддержки по описанию
 * бизнеса и вопроса. Ответ всегда структурирован: текст + карточки услуг.
 */
export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Пустой запрос" }, { status: 400 });
  }

  if (hasLLM()) {
    const system = `Ты — AI-помощник Единого портала поддержки бизнеса холдинга «Байтерек» (Казахстан).
Твоя задача — подобрать предпринимателю подходящие меры поддержки из каталога и объяснить условия простым языком, без канцелярита.

Каталог услуг:
${servicesContext()}

Отвечай СТРОГО в JSON:
{"reply": "короткий дружелюбный ответ на русском, 2-4 предложения, без markdown", "services": ["code1", "code2"]}
В services — коды максимум 3 наиболее подходящих услуг из каталога (может быть пустой список, если вопрос не про подбор).`;

    const raw = await askLLM(system, message);
    if (raw) {
      try {
        const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
        const services = (parsed.services ?? [])
          .map((c: string) => getService(c))
          .filter(Boolean)
          .map(toCard);
        return NextResponse.json({ reply: parsed.reply, services, engine: "llm" });
      } catch {
        return NextResponse.json({ reply: raw, services: [], engine: "llm" });
      }
    }
  }

  const { services, note } = ruleBasedMatch(message);
  return NextResponse.json({ reply: note, services: services.map(toCard), engine: "rules" });
}

function toCard(s: NonNullable<ReturnType<typeof getService>>) {
  return {
    code: s.code,
    title: s.title,
    summary: s.summary,
    organization: s.organization,
    conditions: s.conditions.slice(0, 3),
  };
}
