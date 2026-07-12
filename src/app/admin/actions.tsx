"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export function CreateServiceButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const { id } = await res.json();
    router.push(`/admin/services/${id}`);
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-brand-800 px-5 py-3 text-[13.5px] font-extrabold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
      Новая услуга
    </button>
  );
}

export function AdminServiceActions({ id, status, code }: { id: number; status: string; code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setStatus", status: status === "published" ? "draft" : "published" }),
    });
    router.refresh();
    setBusy(false);
  }

  async function remove() {
    if (!confirm("Удалить услугу? Это действие необратимо.")) return;
    setBusy(true);
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Link
        href={`/admin/services/${id}`}
        title="Редактировать в конструкторе"
        className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
      >
        <Pencil size={15} />
      </Link>
      <button
        onClick={toggle}
        disabled={busy}
        title={status === "published" ? "Снять с публикации" : "Опубликовать"}
        className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
      >
        {status === "published" ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
      <Link
        href={`/services/${code}`}
        title="Открыть на портале"
        className="hidden h-8.5 items-center rounded-lg px-2 text-[11px] font-bold text-slate-400 transition hover:bg-brand-50 hover:text-brand-600 sm:flex"
      >
        Открыть
      </Link>
      <button
        onClick={remove}
        disabled={busy}
        title="Удалить"
        className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
