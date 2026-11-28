import type { CurrencyCode } from "@/types/garmentflow";

const CURRENCY_LOCALES: Record<CurrencyCode, { locale: string; symbol: string }> = {
  INR: { locale: "en-IN", symbol: "₹" },
  USD: { locale: "en-US", symbol: "$" },
  EUR: { locale: "de-DE", symbol: "€" },
  GBP: { locale: "en-GB", symbol: "£" },
};

export function formatCurrency(amount: number, currency: CurrencyCode = "INR"): string {
  const { locale } = CURRENCY_LOCALES[currency] ?? CURRENCY_LOCALES.INR;
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatCurrencyExact(amount: number, currency: CurrencyCode = "INR"): string {
  const { locale } = CURRENCY_LOCALES[currency] ?? CURRENCY_LOCALES.INR;
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-IN").format(safe);
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return "—";
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMonthLabel(month: number, year?: number): string {
  const d = new Date(year ?? 2026, month - 1, 1);
  const label = d.toLocaleDateString("en-IN", { month: "short" });
  return year ? `${label} ${year}` : label;
}

export function calculateWorkingHours(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);
  if ([inH, inM, outH, outM].some(Number.isNaN)) return 0;
  const start = inH * 60 + inM;
  const end = outH * 60 + outM;
  if (end <= start) return 0;
  return Math.round(((end - start) / 60) * 100) / 100;
}

export function csvEscape(value: string | number | undefined): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
