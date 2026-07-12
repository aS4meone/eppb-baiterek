"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";

/** Вход администратора. В проде — корпоративный SSO Холдинга. */
export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError("Неверный пароль");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <form onSubmit={login} className="card p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <KeyRound size={25} />
        </span>
        <h1 className="mt-5 text-[22px] font-extrabold tracking-tight text-brand-950">Кабинет администратора</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
          Доступ для уполномоченных сотрудников Холдинга и дочерних организаций.
          В проде — корпоративный SSO.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль администратора"
          autoFocus
          className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-[14px] outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        {error && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-red-600">
            <ShieldAlert size={13} /> {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-800 px-5 py-3.5 text-[14.5px] font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Войти
        </button>
        <p className="mt-4 text-[11.5px] text-slate-400">Демо-доступ для экспертной комиссии: <b>baiterek2026</b></p>
      </form>
    </div>
  );
}
