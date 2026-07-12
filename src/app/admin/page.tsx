import type { Metadata } from "next";
import Link from "next/link";
import { FileStack, Hammer, Inbox, Plus } from "lucide-react";
import { listAllApplications, listServices } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";
import { isAdmin } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { STATUS_LABELS } from "@/lib/engine/types";
import { AdminServiceActions, CreateServiceButton } from "./actions";
import { AdminLogin } from "./login";

export const metadata: Metadata = { title: "Административный кабинет" };

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  const services = listServices({ includeUnpublished: true });
  const applications = listAllApplications();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-brand-950">Административный кабинет</h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Управление услугами, формами и заявками. Услуги собираются в конструкторе — без разработки.
          </p>
        </div>
        <div className="ml-auto">
          <CreateServiceButton />
        </div>
      </div>

      {/* Метрики */}
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Metric icon={Hammer} label="Услуг в конструкторе" value={services.length} sub={`${services.filter((s) => s.status === "published").length} опубликовано`} />
        <Metric icon={Inbox} label="Заявок всего" value={applications.length} sub={`${applications.filter((a) => a.status === "in_review").length} на рассмотрении`} />
        <Metric icon={FileStack} label="Организаций-операторов" value={new Set(services.map((s) => s.organization)).size} sub="дочерние организации Холдинга" />
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Услуги */}
        <section>
          <h2 className="mb-3.5 text-[16px] font-extrabold text-brand-950">Услуги</h2>
          <div className="card divide-y divide-slate-100">
            {services.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-4.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/services/${s.id}`}
                      className="truncate text-[14px] font-extrabold text-brand-950 hover:text-brand-600"
                    >
                      {s.title}
                    </Link>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${
                        s.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {s.status === "published" ? "Опубликована" : "Черновик"}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-slate-400">
                    {s.organization} · v{s.version} · {s.schema.stages.length}{" "}
                    {s.schema.stages.length === 1 ? "этап" : "этапа"} ·{" "}
                    {s.schema.stages.reduce((n, st) => n + st.steps.reduce((m, x) => m + x.fields.length, 0), 0)} полей
                  </div>
                </div>
                <AdminServiceActions id={s.id} status={s.status} code={s.code} />
              </div>
            ))}
          </div>
        </section>

        {/* Заявки */}
        <aside>
          <h2 className="mb-3.5 text-[16px] font-extrabold text-brand-950">Последние заявки</h2>
          <div className="card divide-y divide-slate-100">
            {applications.length === 0 && (
              <div className="p-6 text-center text-[13px] text-slate-400">Заявок пока нет</div>
            )}
            {applications.slice(0, 8).map((a) => (
              <div key={a.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11.5px] font-extrabold tabular-nums text-slate-400">{a.number}</span>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-1 truncate text-[13px] font-bold text-brand-950">{a.serviceTitle}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(a.updatedAt)} · {STATUS_LABELS[a.status]}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }: { icon: typeof Inbox; label: string; value: number; sub: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={20} />
      </span>
      <div>
        <div className="text-[22px] font-extrabold leading-none text-brand-950">{value}</div>
        <div className="mt-1 text-[12px] font-bold text-slate-500">{label}</div>
        <div className="text-[11px] text-slate-400">{sub}</div>
      </div>
    </div>
  );
}
