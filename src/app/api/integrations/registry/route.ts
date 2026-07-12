import { NextRequest, NextResponse } from "next/server";

/**
 * Имитация интеграции с ГБД «Юридические лица» / «Физические лица»
 * через Единую интеграционную шину Холдинга.
 * Детерминированный мок: данные генерируются из номера.
 */
const COMPANY_NAMES = [
  "ТОО «AgroTrans Logistics»",
  "ТОО «Qazaq Rail Group»",
  "ТОО «Дала Инвест»",
  "АО «Туран Логистика»",
  "ТОО «Nomad Farm»",
  "ТОО «Steppe Industries»",
];
const PERSON_NAMES = [
  "Асқар Серікұлы",
  "Айгерім Нұрланқызы",
  "Дамир Ахметов",
  "Жанар Оспанова",
];

export async function GET(req: NextRequest) {
  const bin = req.nextUrl.searchParams.get("bin");
  const iin = req.nextUrl.searchParams.get("iin");
  const id = bin ?? iin;

  if (!id || !/^\d{12}$/.test(id)) {
    return NextResponse.json({ found: false });
  }

  // лёгкая задержка — как у настоящей шины
  await new Promise((r) => setTimeout(r, 350));

  const idx = Number(id[11]);
  if (bin) {
    return NextResponse.json({
      found: true,
      source: "ГБД «Юридические лица» (мок)",
      name: COMPANY_NAMES[idx % COMPANY_NAMES.length],
      oked: "49.20 Грузовые железнодорожные перевозки",
      registered: "2018-03-14",
    });
  }
  return NextResponse.json({
    found: true,
    source: "ГБД «Физические лица» (мок)",
    name: PERSON_NAMES[idx % PERSON_NAMES.length],
  });
}
