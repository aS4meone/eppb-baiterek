import Link from "next/link";
import { Landmark } from "lucide-react";
import { getLocale, makeT } from "@/lib/i18n";

const ORGS = [
  "Банк Развития Казахстана",
  "Фонд «Даму»",
  "KazakhExport",
  "Отбасы банк",
  "КазАгроФинанс",
  "Аграрная кредитная корпорация",
  "Фонд развития промышленности",
  "Qazaqstan Investment Corporation",
];

export async function Footer() {
  const t = makeT(await getLocale());
  return (
    <footer className="mt-16 border-t border-brand-100 bg-brand-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-400">
              <Landmark size={19} />
            </span>
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold text-white">{t("footer.title")}</div>
              <div className="text-[11px] text-slate-400">{t("footer.org")}</div>
            </div>
          </div>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-slate-400">{t("footer.about")}</p>
        </div>
        <div>
          <div className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-500">{t("footer.portal")}</div>
          <ul className="space-y-2 text-[13px]">
            <li><Link href="/services" className="hover:text-white">{t("nav.services")}</Link></li>
            <li><Link href="/map" className="hover:text-white">{t("nav.map")}</Link></li>
            <li><Link href="/reports" className="hover:text-white">{t("nav.reports")}</Link></li>
            <li><Link href="/materials" className="hover:text-white">{t("nav.materials")}</Link></li>
            <li><Link href="/admin" className="hover:text-white">{t("nav.staff")}</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-500">{t("footer.group")}</div>
          <ul className="space-y-2 text-[13px] text-slate-400">
            {ORGS.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-[12px] text-slate-500">{t("footer.rights")}</div>
    </footer>
  );
}
