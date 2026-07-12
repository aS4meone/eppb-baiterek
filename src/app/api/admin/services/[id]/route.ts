import { NextRequest, NextResponse } from "next/server";
import { deleteService, getServiceById, setServiceStatus, upsertService } from "@/lib/repo";
import type { ServiceStatus } from "@/lib/engine/types";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/services/[id]">) {
  const { id } = await ctx.params;
  const existing = getServiceById(Number(id));
  if (!existing) return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });

  const body = await req.json();

  if (body.action === "setStatus") {
    setServiceStatus(existing.id, body.status as ServiceStatus);
    return NextResponse.json({ ok: true });
  }

  const updated = upsertService({
    id: existing.id,
    code: body.code ?? existing.code,
    title: body.title ?? existing.title,
    summary: body.summary ?? existing.summary,
    description: body.description ?? existing.description,
    category: body.category ?? existing.category,
    direction: body.direction ?? existing.direction,
    organization: body.organization ?? existing.organization,
    audience: body.audience ?? existing.audience,
    conditions: body.conditions ?? existing.conditions,
    schema: body.schema ?? existing.schema,
    status: existing.status,
    isPopular: existing.isPopular,
  });
  return NextResponse.json({ ok: true, version: updated.version });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/admin/services/[id]">) {
  const { id } = await ctx.params;
  deleteService(Number(id));
  return NextResponse.json({ ok: true });
}
