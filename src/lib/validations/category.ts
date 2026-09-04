import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(100),
  description: z.string().trim().max(255).optional().nullable(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(255).optional().nullable(),
});

export const categoryQuerySchema = z.object({
  search: z.string().trim().optional(),
});

export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;