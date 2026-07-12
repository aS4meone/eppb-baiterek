import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AiAssistant } from "@/components/ai/assistant";
import { seedIfEmpty } from "@/lib/seed";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "ЕППБ — Единый портал поддержки бизнеса | Байтерек",
    template: "%s | ЕППБ Байтерек",
  },
  description:
    "Единая цифровая точка входа к мерам поддержки бизнеса холдинга «Байтерек»: кредитование, лизинг, гарантирование, страхование экспорта и жилищные программы.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  seedIfEmpty();
  return (
    <html lang="ru" className={`${manrope.variable} h-full`}>
      <body className="font-sans flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AiAssistant />
      </body>
    </html>
  );
}
