import { NextRequest, NextResponse } from "next/server";
import { getApplication, getDemoUser, getServiceById, pushNotification, updateApplication } from "@/lib/repo";
import { isUser } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/engine/types";

/**
 * Имитация обратного потока из BPM-системы дочерней организации:
 * оператор рассматривает заявку и продвигает статус. В демо статус
 * продвигается по цепочке за одно нажатие «Проверить статус».
 */
const FLOW: { from: ApplicationStatus; to: ApplicationStatus; title: string; comment: string }[] = [
  { from: "in_review", to: "pre_approved", title: "Предварительное одобрение", comment: "Кредитный комитет одобрил индикативные условия" },
  { from: "pre_approved", to: "stage2_available", title: "Открыт II этап", comment: "Заполните расширенные данные и приложите документы" },
  { from: "stage2_submitted", to: "approved", title: "Финальное одобрение", comment: "Договор направлен на подписание ЭЦП" },
];

export async function POST(req: NextRequest) {
  if (!(await isUser())) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  const { applicationId } = await req.json();
  const app = getApplication(Number(applicationId));
  const owner = getDemoUser();
  if (!app || app.userId !== owner.id) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });

  const service = getServiceById(app.serviceId);
  const hasStage2 = (service?.schema.stages.length ?? 1) > 1;

  let transition = FLOW.find((f) => f.from === app.status);
  // услуги без II этапа одобряются сразу после pre_approved
  if (transition?.to === "stage2_available" && !hasStage2) {
    transition = { from: "pre_approved", to: "approved", title: "Финальное одобрение", comment: "Договор направлен на подписание ЭЦП" };
  }

  if (!transition) {
    return NextResponse.json({ changed: false, status: app.status });
  }

  updateApplication(
    app.id,
    { status: transition.to },
    { status: transition.to, title: transition.title, comment: transition.comment, actor: service?.organization ?? "BPM-система оператора" }
  );
  const user = getDemoUser();
  pushNotification(user.id, transition.title, `Заявка ${app.number}: ${transition.comment.toLowerCase()}.`, app.id);

  return NextResponse.json({ changed: true, status: transition.to });
}
