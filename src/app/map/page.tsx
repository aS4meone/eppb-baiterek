import type { Metadata } from "next";
import { listProjects } from "@/lib/repo";
import { MapExplorer } from "./map-explorer";

export const metadata: Metadata = { title: "Карта проектов" };

export default function MapPage() {
  const projects = listProjects();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-[28px] font-extrabold tracking-tight text-brand-950">Карта проектов Холдинга</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-slate-500">
        Проекты, профинансированные группой «Байтерек». Данные поступают из ИС Аналитического центра
        через интеграционную шину (в демо — тестовый набор).
      </p>
      <div className="mt-6">
        <MapExplorer projects={projects} />
      </div>
    </div>
  );
}
