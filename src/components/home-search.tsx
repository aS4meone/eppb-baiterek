"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/services?q=${encodeURIComponent(q.trim())}` : "/services");
  }

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Чем занимается ваш бизнес?"
          className="w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 pl-11 pr-4 text-[14px] text-white outline-none backdrop-blur placeholder:text-slate-400 focus:border-gold-400/60 focus:bg-white/15"
        />
      </div>
      <button
        type="submit"
        className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gold-500 px-5 py-3.5 text-[14px] font-extrabold text-brand-950 transition hover:bg-gold-400"
      >
        <Sparkles size={16} />
        Подобрать
      </button>
    </form>
  );
}
