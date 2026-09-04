/**
 * Invoice number generation — referensi PRD Section 12.7.
 * Format: INV-YYYYMMDD-XXXXX (contoh: INV-20260904-00001).
 *
 * Generation dilakukan DI DALAM database transaction yang sama dengan insert
 * `transactions` untuk menghindari race condition (generate-then-check terpisah
 * dilarang). UNIQUE constraint pada `invoice_number` tetap menjadi jaminan akhir.
 *
 * `db` adalah instance Prisma (bisa interactive transaction client `tx`)
 * sesuai konteks pemanggilan.
 */
import type { PrismaClient } from "@prisma/client";

function todayPrefix(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `INV-${y}${m}${d}-`;
}

export async function generateInvoiceNumber(
  db: { transaction: { count: (args: { where: Record<string, unknown> }) => Promise<number> } },
  date: Date = new Date()
): Promise<string> {
  const prefix = todayPrefix(date);
  const count = await db.transaction.count({
    where: { invoice_number: { startsWith: prefix } },
  });
  const seq = count + 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

/** Mem-parse nomor invoice untuk dipakai kembali (jika perlu). */
export function invoiceDatePrefix(date: Date): string {
  return todayPrefix(date);
}