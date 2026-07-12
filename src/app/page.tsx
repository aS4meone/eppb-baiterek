import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  FileCheck2,
  Landmark,
  LayoutGrid,
  Map,
  MessageSquareText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { listServices } from "@/lib/repo";
import { ServiceCard } from "@/components/service-card";
import { HomeSearch } from "@/components/home-search";

const DIRECTIONS = [
  { icon: Wallet, title: "Кредитование", text: "Оборотные средства и инвестиционные займы" },
  { icon: Building2, title: "Лизинг", text: "Техника, вагоны, оборудование" },
  { icon: ShieldCheck, title: "Гарантии и страхование", text: "Покрытие залога и экспортных рисков" },
  { icon: Landmark, title: "Жильё", text: "Жилстройсбережения и ипотека" },
];

export default function HomePage() {
  const services = listServices();
  const popular = services.filter((s) => s.isPopular).slice(0, 3);
  const rest = services.filter((s) => !s.isPopular).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(700px 340px at 78% 18%, rgba(42,99,184,.55), transparent 65%), radial-gradient(520px 300px at 12% 92%, rgba(201,162,39,.22), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              70+ мер поддержки восьми институтов развития — в одном окне
            </div>
            <h1 className="text-[34px] font-extrabold leading-[1.12] tracking-tight sm:text-[44px]">
              Поддержка для вашего бизнеса —{" "}
              <span className="text-gold-400">без хождения по инстанциям</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-slate-300">
              Найдите меру поддержки, подайте заявку онлайн и отслеживайте её статус в едином
              личном кабинете. Кредиты, лизинг, гарантии, страхование экспорта и жильё.
            </p>
            <div className="mt-7">
              <HomeSearch />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[12.5px] text-slate-400">
              Например:
              {[
                ["вагоны в лизинг", "/services/wagons_leasing"],
                ["откормочная площадка", "/services/agro_animal"],
                ["гарантия по кредиту", "/services/damu_guarantee"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-full border border-white/15 px-3 py-1 font-semibold text-slate-200 transition hover:border-gold-400 hover:text-gold-300"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Направления */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DIRECTIONS.map((d) => (
            <Link
              key={d.title}
              href="/services"
              className="card card-hover flex items-start gap-3.5 p-4.5 sm:p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <d.icon size={19} />
              </span>
              <span>
                <span className="block text-[14px] font-extrabold text-brand-950">{d.title}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-slate-500">{d.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Услуги */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-[24px] font-extrabold tracking-tight text-brand-950">Меры поддержки</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">Популярные услуги группы Холдинга</p>
          </div>
          <Link
            href="/services"
            className="flex items-center gap-1.5 rounded-xl bg-brand-50 px-4 py-2.5 text-[13px] font-bold text-brand-700 transition hover:bg-brand-100"
          >
            Весь каталог <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...popular, ...rest].map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      {/* Как это работает */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="card overflow-hidden bg-brand-900 p-8 text-white sm:p-10">
          <h2 className="text-[22px] font-extrabold tracking-tight">Как получить поддержку</h2>
          <div className="mt-7 grid gap-8 sm:grid-cols-4">
            {[
              { n: "01", icon: MessageSquareText, t: "Подберите услугу", d: "Поиск, каталог или AI-помощник подскажут подходящую меру" },
              { n: "02", icon: FileCheck2, t: "Подайте заявку", d: "Пошаговая форма с подсказками, данные подтянутся из eGov" },
              { n: "03", icon: LayoutGrid, t: "Следите за статусом", d: "Все заявки, документы и уведомления — в одном кабинете" },
              { n: "04", icon: ShieldCheck, t: "Получите результат", d: "Подписание договора ЭЦП онлайн, без визита в офис" },
            ].map((s) => (
              <div key={s.n}>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-extrabold text-gold-400">{s.n}</span>
                  <s.icon size={20} className="text-brand-200" />
                </div>
                <div className="mt-3 text-[15px] font-extrabold">{s.t}</div>
                <div className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Экосистема: карта, отчёты, материалы */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/map" className="card card-hover group p-6">
            <Map size={22} className="text-brand-500" />
            <h3 className="mt-3.5 text-[16.5px] font-extrabold text-brand-950 group-hover:text-brand-700">
              Карта проектов
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              25+ проектов, профинансированных группой Холдинга, — на интерактивной карте Казахстана с
              фильтрами по отраслям и регионам.
            </p>
          </Link>
          <Link href="/reports" className="card card-hover group p-6">
            <BarChart3 size={22} className="text-brand-500" />
            <h3 className="mt-3.5 text-[16.5px] font-extrabold text-brand-950 group-hover:text-brand-700">
              Аналитика и отчётность
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              Годовые отчёты, дашборды и исследования Холдинга и дочерних организаций в одном каталоге.
            </p>
          </Link>
          <Link href="/materials" className="card card-hover group p-6">
            <BookOpen size={22} className="text-brand-500" />
            <h3 className="mt-3.5 text-[16.5px] font-extrabold text-brand-950 group-hover:text-brand-700">
              Инструменты для бизнеса
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              База знаний, шаблоны бизнес-планов, чек-листы документов и калькуляторы — бесплатно.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
