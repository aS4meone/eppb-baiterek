import { NextRequest, NextResponse } from "next/server";
import { createApplication, getApplication, getDemoUser, getServiceById, pushNotification, updateApplication } from "@/lib/repo";
import { validateStep, visibleSteps } from "@/lib/engine/logic";
import { isUser } from "@/lib/auth";

/**
 * Подача заявки. stageIndex 0 — новая заявка, stageIndex > 0 — данные
 * следующего этапа к существующей заявке (applicationId).
 * Валидация выполняется по той же схеме, что и на клиенте.
 */
export async function POST(req: NextRequest) {
  if (!(await isUser())) {
    return NextResponse.json({ error: "Войдите через eGov, чтобы подать заявку" }, { status: 401 });
  }
  const body = await req.json();
  const { serviceId, stageIndex = 0, applicationId, data } = body ?? {};

  const service = getServiceById(Number(serviceId));
  if (!service) return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });

  const stage = service.schema.stages[stageIndex];
  if (!stage) return NextResponse.json({ error: "Этап не найден" }, { status: 400 });

  // серверная валидация видимых полей
  for (const step of visibleSteps(stage, data ?? {})) {
    const errs = validateStep(step, data ?? {});
    if (Object.keys(errs).length) {
      return NextResponse.json({ error: "Заполнены не все обязательные поля", fields: errs }, { status: 422 });
    }
  }

  const user = getDemoUser();

  if (stageIndex > 0 && applicationId) {
    const app = getApplication(Number(applicationId));
    if (!app || app.userId !== user.id) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    const updated = updateApplication(
      app.id,
      { data: { ...app.data, ...data }, stageIndex, status: "stage2_submitted" },
      { status: "stage2_submitted", title: `${stage.title}: данные поданы`, comment: "Документы подписаны ЭЦП, пакет передан оператору", actor: "Заявитель" }
    );
    pushNotification(user.id, "Второй этап подан", `Заявка ${app.number}: расширенные данные переданы в ${service.organization}.`, app.id);
    return NextResponse.json({ id: updated!.id });
  }

  const app = createApplication(service.id, user.id, data ?? {});
  pushNotification(
    user.id,
    "Заявка принята",
    `Заявка ${app.number} по услуге «${service.title}» передана в ${service.organization} через интеграционную шину.`,
    app.id
  );
  return NextResponse.json({ id: app.id, number: app.number });
}
