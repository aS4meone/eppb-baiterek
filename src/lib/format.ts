export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
