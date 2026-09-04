import { NextRequest } from "next/server";
import { handle, ok, created } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-guard";
import { apiError } from "@/lib/errors";
import { z } from "zod";

const paymentMethodCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  is_active: z.boolean().default(true),
});

export const GET = () =>
  handle(async () => {
    await requireUser();
    const data = await prisma.paymentMethod.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });
    return ok(data);
  });

export const POST = (req: NextRequest) =>
  handle(async () => {
    await requireAdmin();
    const body = await req.json();
    const input = paymentMethodCreateSchema.parse(body);
    const existing = await prisma.paymentMethod.findFirst({ where: { name: input.name } });
    if (existing) {
      throw apiError("VALIDATION_ERROR", "Nama metode pembayaran sudah digunakan");
    }
    const method = await prisma.paymentMethod.create({
      data: { name: input.name, is_active: input.is_active },
    });
    return created(method);
  });