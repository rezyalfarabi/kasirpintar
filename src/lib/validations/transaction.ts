import { z } from "zod";

/**
 * Skema transaksi — referensi PRD Section 12.5.
 * Client hanya mengirim item, payment_method_id, dan amount_paid.
 * total/subtotal/change SELALU dihitung ulang di server.
 */
export const transactionCreateSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.coerce.number().int().min(1, "Quantity minimal 1"),
      })
    )
    .min(1, "Cart tidak boleh kosong"),
  payment_method_id: z.number().int().positive(),
  amount_paid: z.coerce.number().min(0, "Jumlah bayar tidak boleh negatif"),
  payment_reference: z.string().trim().max(100).optional().nullable(),
});

export const transactionQuerySchema = z.object({
  search: z.string().trim().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  user_id: z.coerce.number().int().positive().optional(), // khusus Admin
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const transactionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;