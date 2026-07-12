"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bot, Loader2, Send, Sparkles, X } from "lucide-react";

interface ServiceHit {
  code: string;
  title: string;
  summary: string;
  organization: string;
  conditions: { code: string; title: string; value: string }[];
}

interface Msg {
  role: "user" | "assistant";
  text: string;
  services?: ServiceHit[];
}

const SUGGESTIONS = [
  "Хочу купить 20 полувагонов, что мне подойдёт?",
  "Держу откормочную площадку на 200 голов, нужны корма",
  "Банк требует залог, которого у меня нет",
  "Продаю муку в Узбекистан, боюсь неплатежа",
];

/** Плавающий AI-помощник: подбор мер поддержки на любом экране портала */
export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: t }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply, services: data.services }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Не получилось связаться с сервером. Попробуйте ещё раз." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Кнопка */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="AI-помощник"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-800 text-gold-300 shadow-lg shadow-brand-900/30 transition hover:scale-105 hover:bg-brand-700"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {/* Панель */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[min(600px,calc(100vh-130px))] w-[min(400px,calc(100vw-40px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-brand-900/20">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-brand-950 px-5 py-4 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-400">
              <Bot size={18} />
            </span>
            <div>
              <div className="text-[14px] font-extrabold">AI-помощник ЕППБ</div>
              <div className="text-[11px] text-slate-400">Подберёт меру поддержки под ваш бизнес</div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div>
                <p className="px-1 text-[13px] leading-relaxed text-slate-500">
                  Опишите свой бизнес и что хотите профинансировать — подберу подходящие меры поддержки
                  и объясню условия простым языком.
                </p>
                <div className="mt-3 space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                    m.role === "user"
                      ? "ml-auto rounded-br-md bg-brand-800 text-white"
                      : "rounded-bl-md bg-slate-100 text-slate-700"
                  }`}
                >
                  {m.text}
                </div>
                {m.services && m.services.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {m.services.map((s) => (
                      <Link
                        key={s.code}
                        href={`/services/${s.code}`}
                        onClick={() => setOpen(false)}
                        className="group block rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-brand-300 hover:shadow-sm"
                      >
                        <div className="text-[13px] font-extrabold text-brand-950 group-hover:text-brand-700">
                          {s.title}
                          <ArrowUpRight size={13} className="ml-1 inline -translate-y-px text-slate-300 group-hover:text-brand-500" />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] font-bold text-slate-500">
                          {s.conditions.map((c) => (
                            <span key={c.code}>
                              {c.title}: <span className="text-brand-800">{c.value}</span>
                            </span>
                          ))}
                        </div>
                        <div className="mt-1 text-[10.5px] text-slate-400">{s.organization}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 px-1 text-[12.5px] font-semibold text-slate-400">
                <Loader2 size={14} className="animate-spin" /> Подбираю…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-slate-100 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Опишите ваш бизнес и задачу…"
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
