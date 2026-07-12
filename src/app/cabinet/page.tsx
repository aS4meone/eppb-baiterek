import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Bell, FileText, Inbox, User2 } from "lucide-react";
import { getDemoUser, listApplications, listNotifications } from "@/lib/repo";
import { EgovLogin } from "./login";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Личный кабинет" };

export default async function CabinetPage() {
  const authed = (await cookies()).get("eppb_session")?.value === "1";
  if (!authed) return <EgovLogin />;

  const user = getDemoUser();
  const applications = listApplications(user.id);
  const notifications = listNotifications(user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-800 text-gold-300">
          <User2 size={22} />
        </span>
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-brand-950">{user.name}</h1>
          <p className="text-[13px] font-semibold text-slate-500">
            {user.company} · БИН {user.bin} · {user.region}
          </p>
        </div>
        <Link
          href="/services"
          className="ml-auto flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-[13px] font-bold text-brand-700 transition hover:bg-brand-100"
        >
          Новая заявка <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Заявки */}
        <section>
          <h2 className="mb-3.5 flex items-center gap-2 text-[16px] font-extrabold text-brand-950">
            <FileText size={17} className="text-brand-400" /> Мои заявки
          </h2>
          {applications.length === 0 ? (
            <div className="card p-12 text-center">
              <Inbox size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 text-[14.5px] font-bold text-slate-600">Пока нет заявок</p>
              <p className="mt-1 text-[13px] text-slate-400">
                Выберите меру поддержки в каталоге и подайте первую заявку онлайн
              </p>
              <Link
                href="/services"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-800 px-5 py-3 text-[13.5px] font-bold text-white transition hover:bg-brand-700"
              >
                Перейти в каталог <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => (
                <Link
                  key={a.id}
                  href={`/cabinet/applications/${a.id}`}
                  className="card card-hover flex flex-wrap items-center gap-x-5 gap-y-2 p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[12px] font-extrabold tabular-nums text-slate-400">{a.number}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="mt-1.5 truncate text-[15px] font-extrabold text-brand-950">{a.serviceTitle}</div>
                    <div className="mt-0.5 text-[12px] text-slate-400">
                      Обновлена {formatDateTime(a.updatedAt)}
                    </div>
                  </div>
                  <ArrowRight size={17} className="text-slate-300" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Уведомления */}
        <aside>
          <h2 className="mb-3.5 flex items-center gap-2 text-[16px] font-extrabold text-brand-950">
            <Bell size={17} className="text-brand-400" /> Уведомления
          </h2>
          <div className="card divide-y divide-slate-100">
            {notifications.length === 0 && (
              <div className="p-6 text-center text-[13px] text-slate-400">Уведомлений пока нет</div>
            )}
            {notifications.slice(0, 8).map((n) => (
              <div key={n.id} className="p-4">
                <div className="flex items-start gap-2">
                  {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                  <div>
                    <div className="text-[13px] font-extrabold text-brand-950">{n.title}</div>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{n.body}</p>
                    <div className="mt-1 text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
