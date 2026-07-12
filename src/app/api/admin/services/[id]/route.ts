import { NextRequest, NextResponse } from "next/server";
import { deleteService, getServiceById, setServiceStatus, upsertService } from "@/lib/repo";
import { isAdmin } from "@/lib/auth";
import { validateServiceSchema } from "@/lib/engine/schema-validation";
import type { ServiceStatus } from "@/lib/engine/types";

const ALLOWED_STATUSES: ServiceStatus[] = ["draft", "published", "archived"];

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/services/[id]">) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Требуется авторизация администратора" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = getServiceById(Number(id));
  if (!existing) return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  if (body.action === "setStatus") {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Недопустимый статус" }, { status: 422 });
    }
    setServiceStatus(existing.id, body.status);
    return NextResponse.json({ ok: true });
  }

  let schema = existing.schema;
  if (body.schema !== undefined) {
    const check = validateServiceSchema(body.schema);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 422 });
    schema = check.schema;
  }

  const updated = upsertService({
    id: existing.id,
    code: typeof body.code === "string" && body.code ? body.code : existing.code,
    title: typeof body.title === "string" && body.title ? body.title : existing.title,
    summary: body.summary ?? existing.summary,
    description: body.description ?? existing.description,
    category: body.category ?? existing.category,
    direction: body.direction ?? existing.direction,
    organization: body.organization ?? existing.organization,
    audience: body.audience ?? existing.audience,
    conditions: body.conditions ?? existing.conditions,
    schema,
    status: existing.status,
    isPopular: existing.isPopular,
  });
  return NextResponse.json({ ok: true, version: updated.version });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/admin/services/[id]">) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Требуется авторизация администратора" }, { status: 401 });
  }
  const { id } = await ctx.params;
  deleteService(Number(id));
  return NextResponse.json({ ok: true });
}
