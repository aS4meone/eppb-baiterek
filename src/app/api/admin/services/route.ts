import { NextRequest, NextResponse } from "next/server";
import { upsertService } from "@/lib/repo";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const service = upsertService({
    code: body.code || `service_${Math.random().toString(36).slice(2, 8)}`,
    title: body.title || "Новая услуга",
    summary: body.summary ?? "",
    description: body.description ?? "",
    category: body.category ?? "Кредитование",
    direction: body.direction ?? "",
    organization: body.organization ?? "АО «НУХ «Байтерек»",
    audience: body.audience ?? [],
    conditions: body.conditions ?? [],
    schema: body.schema ?? { stages: [{ id: "main", title: "Заявка", steps: [{ id: "step1", title: "Основные данные", fields: [] }] }] },
    status: "draft",
    isPopular: false,
  });
  return NextResponse.json({ id: service.id, code: service.code });
}
