import { STATUS_LABELS, type ApplicationStatus } from "@/lib/engine/types";

const STYLES: Record<ApplicationStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-50 text-blue-700",
  in_review: "bg-amber-50 text-amber-700",
  need_info: "bg-orange-50 text-orange-700",
  pre_approved: "bg-emerald-50 text-emerald-700",
  stage2_available: "bg-violet-50 text-violet-700",
  stage2_submitted: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11.5px] font-extrabold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
