import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ChevronRight, FileCheck2, PartyPopper } from "lucide-react";
import { getApplication, getServiceById } from "@/lib/repo";
import { allFields } from "@/lib/engine/logic";
import { formatDateTime, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EgovLogin } from "../../login";
import { CheckStatusButton } from "./check-status";

export default async function ApplicationPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const authed = (await cookies()).get("eppb_session")?.value === "1";
  if (!authed) return <EgovLogin />;

  const { id } = await props.params;
  const { submitted } = await props.searchParams;
  const app = getApplication(Number(id));
  if (!app) notFound();

  const service = getServiceById(app.serviceId);
  const fields = service ? allFields(service.schema) : [];
  const fieldLabel = (fid: string) => fields.find((f) => f.id === fid)?.label ?? fid;
  const fieldMeta = (fid: string) => fields.find((f) => f.id === fid);

  const filledEntries = Object.entries(app.data).filter(
    ([k, v]) => v !== "" && v !== null && v !== undefined && fieldMeta(k) && fieldMeta(k)!.type !== "info"
  );
  const documents = filledEntries.filter(([k]) => fieldMeta(k)?.type === "file");
  const answers = filledEntries.filter(([k]) => fieldMeta(k)?.type !== "file");

  const stage2Available = app.status === "stage2_available" && service && service.schema.stages.length > 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-400">
        <Link href="/cabinet" className="hover:text-brand-600">Личный кабинет</Link>
        <ChevronRight size={13} />
        <span className="text-slate-600">Заявка {app.number}</span>
      </nav>

      {submitted && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] font-bold text-emerald-800">
          <PartyPopper size={19} />
          Заявка отправлена! Номер: {app.number}. Оператор получил её через интеграционную шину Холдинга.
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="text-[24px] font-extrabold tracking-tight text-brand-950">{app.serviceTitle}</h1>
        <StatusBadge status={app.status} />
      </div>
      <p className="mt-1 text-[13px] font-semibold text-slate-500">
        {app.number} · подана {formatDateTime(app.createdAt)} · {service?.organization}
      </p>

      {stage2Available && (
        <div className="card mt-6 flex flex-wrap items-center gap-4 border border-violet-200 bg-violet-50/60 p-5">
          <div className="flex-1">
            <div className="text-[15px] font-extrabold text-brand-950">Открыт II этап — полная заявка</div>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
              Индикативные условия одобрены. Заполните расширенные данные и приложите документы —
              всё подписывается ЭЦП онлайн.
            </p>
          </div>
          <Link
            href={`/services/${app.serviceCode}/apply?stage=1&app=${app.id}`}
            className="rounded-xl bg-violet-600 px-5 py-3 text-[13.5px] font-extrabold text-white transition hover:bg-violet-700"
          >
            Перейти ко II этапу
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* История */}
          <section className="card p-6">
            <h2 className="text-[15px] font-extrabold text-brand-950">История рассмотрения</h2>
            <ol className="mt-5 space-y-0">
              {[...app.history].reverse().map((h, i) => (
                <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < app.history.length - 1 && (
                    <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" />
                  )}
                  <span className={`relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${i === 0 ? "border-brand-600 bg-brand-100" : "border-slate-300 bg-white"}`} />
                  <div>
                    <div className="text-[13.5px] font-extrabold text-brand-950">{h.title}</div>
                    {h.comment && <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{h.comment}</p>}
                    <div className="mt-1 text-[11.5px] text-slate-400">
                      {formatDateTime(h.at)} · {h.actor}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <CheckStatusButton applicationId={app.id} status={app.status} />
          </section>

          {/* Данные заявки */}
          <section className="card p-6">
            <h2 className="text-[15px] font-extrabold text-brand-950">Данные заявки</h2>
            <dl className="mt-4 divide-y divide-slate-100">
              {answers.map(([k, v]) => {
                const meta = fieldMeta(k);
                const display =
                  meta?.options?.find((o) => o.value === String(v))?.label ??
                  (meta?.type === "money" || meta?.type === "calc" ? `${formatMoney(Number(v))} ${meta.unit ?? ""}` :
                   typeof v === "boolean" ? (v ? "Да" : "Нет") : String(v));
                return (
                  <div key={k} className="flex justify-between gap-6 py-2.5">
                    <dt className="text-[13px] text-slate-500">{fieldLabel(k)}</dt>
                    <dd className="text-right text-[13px] font-bold text-brand-950">{display}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </div>

        {/* Документы */}
        <aside>
          <section className="card p-6">
            <h2 className="text-[15px] font-extrabold text-brand-950">Документы</h2>
            {documents.length === 0 ? (
              <p className="mt-3 text-[12.5px] leading-relaxed text-slate-400">
                На текущем этапе документы не требуются. Для многоэтапных услуг документы прикладываются на II этапе.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {documents.map(([k, v]) => (
                  <li key={k} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
                    <FileCheck2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div>
                      <div className="text-[12.5px] font-bold text-brand-950">{String(v)}</div>
                      <div className="text-[11px] text-slate-400">{fieldLabel(k)} · подписан ЭЦП</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
