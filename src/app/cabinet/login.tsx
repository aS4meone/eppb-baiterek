"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Fingerprint, Loader2, ShieldCheck } from "lucide-react";

/** Имитация входа через eGov IDP (OAuth) */
export function EgovLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900)); // имитация redirect на idp.egov.kz
    await fetch("/api/auth", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Fingerprint size={26} />
        </span>
        <h1 className="mt-5 text-[22px] font-extrabold tracking-tight text-brand-950">Вход в личный кабинет</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
          Авторизация выполняется через eGov IDP — единую систему идентификации госуслуг Казахстана.
        </p>
        <button
          onClick={login}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#2563ab] px-5 py-3.5 text-[14.5px] font-extrabold text-white transition hover:bg-[#1e5697] disabled:opacity-70"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
          {loading ? "Переход на idp.egov.kz…" : "Войти через eGov"}
        </button>
        <p className="mt-4 text-[11.5px] leading-snug text-slate-400">
          Демо-режим: вход выполняется под тестовым пользователем без реального обращения к eGov.
        </p>
      </div>
    </div>
  );
}
