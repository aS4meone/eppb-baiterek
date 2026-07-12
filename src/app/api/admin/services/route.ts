import { NextRequest, NextResponse } from "next/server";
import { upsertService } from "@/lib/repo";
import { isAdmin } from "@/lib/auth";
import { validateServiceSchema } from "@/lib/engine/schema-validation";
import type { ServiceSchema } from "@/lib/engine/types";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Требуется авторизация администратора" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  let schema: ServiceSchema = { stages: [{ id: "main", title: "Заявка", steps: [{ id: "step1", title: "Основные данные", fields: [] }] }] };
  if (body.schema !== undefined) {
    const check = validateServiceSchema(body.schema);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 422 });
    schema = check.schema;
  }

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
    schema,
    status: "draft",
    isPopular: false,
  });
  return NextResponse.json({ id: service.id, code: service.code });
}
