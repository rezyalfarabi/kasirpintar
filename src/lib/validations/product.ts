import { z } from "zod";

/**
 * Skema produk — single source of truth (dipakai client & server).
 * Referensi PRD Section 12.1 & 12.2.
 * Catatan: `stock` TIDAK pernah dapat diubah lewat update produk (12.2).
 */
export const productCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama produk wajib diisi")
    .max(150, "Nama produk maksimal 150 karakter"),
  barcode: z
    .string()
    .trim()
    .max(64, "Barcode maksimal 64 karakter")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  category_id: z.number().int().positive("Kategori wajib dipilih"),
  purchase_price: z.coerce.number().min(0, "Harga beli tidak boleh negatif"),
  selling_price: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
  minimum_stock: z.coerce.number().int().min(0, "Stok minimum tidak boleh negatif").default(5),
  initial_stock: z.coerce
    .number()
    .int()
    .min(0, "Stok awal tidak boleh negatif")
    .default(0),
  image_url: z.string().trim().max(500).optional().nullable(),
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  barcode: z
    .string()
    .trim()
    .max(64)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  category_id: z.number().int().positive().optional(),
  purchase_price: z.coerce.number().min(0).optional(),
  selling_price: z.coerce.number().min(0).optional(),
  minimum_stock: z.coerce.number().int().min(0).optional(),
  image_url: z.string().trim().max(500).optional().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const productQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  category_id: z.coerce.number().int().positive().optional(),
  stock_status: z.enum(["AMAN", "MENIPIS", "HABIS"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;