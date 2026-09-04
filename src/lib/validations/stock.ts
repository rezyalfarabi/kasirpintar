import { z } from "zod";

/**
 * Skema stok — referensi PRD Section 12.4 & 13 & B.2.
 * Catatan adjustment: `note` WAJIB (alasan) demi akuntabilitas audit (B.2).
 */
export const stockInSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.coerce.number().int().min(1, "Quantity masuk harus > 0"),
  note: z.string().trim().max(255).optional().nullable(),
});

export const stockAdjustmentSchema = z.object({
  product_id: z.number().int().positive(),
  type: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
  quantity: z.coerce.number().int().min(1, "Quantity harus > 0"),
  note: z.string().trim().min(1, "Alasan wajib diisi untuk adjustment").max(255),
});

export const stockIdParamSchema = z.object({
  product_id: z.coerce.number().int().positive(),
});

export type StockInInput = z.infer<typeof stockInSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;