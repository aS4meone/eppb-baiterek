"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export function LangSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function set(next: Locale) {
    if (next === locale || pending) return;
    setPending(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
    setPending(false);
  }

  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 text-[11.5px] font-extrabold">
      {(["ru", "kk"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          className={`px-2 py-1.5 uppercase transition ${
            locale === l ? "bg-brand-800 text-white" : "bg-white text-slate-400 hover:text-brand-600"
          }`}
        >
          {l === "ru" ? "РУ" : "ҚАЗ"}
        </button>
      ))}
    </div>
  );
}
