import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { apiError } from "@/lib/errors";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});

const paramSchema = z.object({ id: z.coerce.number().int().positive() });

export const PATCH = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = paramSchema.parse({ id });
    const body = await req.json();
    const input = updateSchema.parse(body);

    const existing = await prisma.paymentMethod.findUnique({ where: { id: parsed.id } });
    if (!existing) throw apiError("NOT_FOUND", "Metode pembayaran tidak ditemukan");

    if (input.name && input.name !== existing.name) {
      const dup = await prisma.paymentMethod.findFirst({ where: { name: input.name } });
      if (dup) throw apiError("VALIDATION_ERROR", "Nama metode pembayaran sudah digunakan");
    }

    const method = await prisma.paymentMethod.update({
      where: { id: parsed.id },
      data: { name: input.name, is_active: input.is_active },
    });
    return ok(method);
  });