"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import type { ApplicationStatus } from "@/lib/engine/types";

/**
 * Демо-кнопка «Проверить статус»: опрашивает мок-BPM дочерней организации,
 * который продвигает заявку по жизненному циклу. В проде — push из шины.
 */
export function CheckStatusButton({ applicationId, status }: { applicationId: number; status: ApplicationStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const done = status === "approved" || status === "rejected";

  async function check() {
    setLoading(true);
    await fetch("/api/integrations/bpm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });
    router.refresh();
    setLoading(false);
  }

  if (done) return null;

  return (
    <button
      onClick={check}
      disabled={loading}
      className="mt-5 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-[13px] font-bold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
      Проверить статус в BPM-системе оператора
    </button>
  );
}
