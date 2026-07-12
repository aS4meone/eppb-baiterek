import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getService, getDemoUser, getReference, getApplication } from "@/lib/repo";
import { allFields } from "@/lib/engine/logic";
import { isUser } from "@/lib/auth";
import { Wizard } from "@/components/wizard/wizard";
import { EgovLogin } from "@/app/cabinet/login";

/**
 * Страница подачи: универсальна для всех услуг и этапов.
 * ?stage=1&app=ID — заполнение II этапа существующей заявки.
 */
export default async function ApplyPage(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ stage?: string; app?: string }>;
}) {
  const { code } = await props.params;
  const { stage: stageParam, app: appParam } = await props.searchParams;
  const service = getService(code);
  if (!service) notFound();

  // подача заявки — только после входа через eGov
  if (!(await isUser())) return <EgovLogin />;

  const stageIndex = Math.min(Number(stageParam ?? 0) || 0, service.schema.stages.length - 1);
  const stage = service.schema.stages[stageIndex];

  const application = appParam ? getApplication(Number(appParam)) : null;

  const user = getDemoUser();
  const profile: Record<string, string> = {
    "user.name": user.name,
    "user.iin": user.iin,
    "company.name": user.company ?? "",
    "company.bin": user.bin ?? "",
    "company.oked": user.oked ?? "",
    "company.region": user.region ?? "",
  };

  // собрать нужные справочники из схемы
  const references: Record<string, { value: string; label: string }[]> = {};
  for (const f of allFields(service.schema)) {
    if (f.reference && !references[f.reference]) references[f.reference] = getReference(f.reference);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-400">
        <Link href="/services" className="hover:text-brand-600">Меры поддержки</Link>
        <ChevronRight size={13} />
        <Link href={`/services/${service.code}`} className="hover:text-brand-600">{service.title}</Link>
        <ChevronRight size={13} />
        <span className="text-slate-600">{stage.title}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[24px] font-extrabold tracking-tight text-brand-950">{service.title}</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">
          {stage.title}
          {application && <> · заявка {application.number}</>}
        </p>
      </div>

      <Wizard
        service={service}
        stageIndex={stageIndex}
        profile={profile}
        references={references}
        applicationId={application?.id}
        initialData={application?.data}
      />
    </div>
  );
}
