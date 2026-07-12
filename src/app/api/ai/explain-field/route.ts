import { NextRequest, NextResponse } from "next/server";
import { askLLM, hasLLM } from "@/lib/ai";

/**
 * AI-подсказка по конкретному полю формы: объясняет, что вводить и зачем,
 * простым языком предпринимателя. Снижает ошибки и возвраты «на доработку».
 */
export async function POST(req: NextRequest) {
  const { serviceTitle, label, hint, type, options } = await req.json();
  if (!label) return NextResponse.json({ error: "Нет поля" }, { status: 400 });

  if (hasLLM()) {
    const system = `Ты — помощник Единого портала поддержки бизнеса «Байтерек» (Казахстан).
Пользователь заполняет заявку на услугу «${serviceTitle}» и попросил объяснить поле формы.
Объясни простым языком без канцелярита: что сюда вводить, где это взять и на что влияет. 2-3 коротких предложения.
Отвечай строго в JSON: {"explanation": "..."}`;

    const user = `Поле: «${label}»${hint ? `. Подсказка формы: ${hint}` : ""}. Тип: ${type}.${
      options?.length ? ` Варианты: ${options.join(", ")}.` : ""
    }`;

    const raw = await askLLM(system, user, 300);
    if (raw) {
      try {
        const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
        if (parsed.explanation) return NextResponse.json({ explanation: parsed.explanation, engine: "llm" });
      } catch {}
    }
  }

  return NextResponse.json({
    explanation:
      hint ||
      `Укажите «${label.toLowerCase()}» — эти данные нужны оператору услуги для рассмотрения заявки. Если сомневаетесь, откройте карточку услуги или спросите AI-помощника в правом нижнем углу.`,
    engine: "fallback",
  });
}
