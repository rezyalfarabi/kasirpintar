import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format angka ke Rupiah (IDR). */
export function formatIDR(value: number | string | { toString(): string }): string {
  const num = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Tipe status stok dinamis (Section 13.1 PRD). */
export type StockStatusValue = "AMAN" | "MENIPIS" | "HABIS";

/** Hitung status stok secara dinamis berdasarkan stock vs minimum_stock. */
export function computeStockStatus(stock: number, minimumStock: number): StockStatusValue {
  if (stock <= 0) return "HABIS";
  if (stock <= minimumStock) return "MENIPIS";
  return "AMAN";
}