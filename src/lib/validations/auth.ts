import { z } from "zod";
import { Role } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(150),
  password: z.string().min(1, "Password wajib diisi").max(100),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email("Email tidak valid").max(150),
  password: z.string().min(8, "Password minimal 8 karakter").max(100),
  role: z.enum([Role.ADMIN, Role.KASIR]).default(Role.KASIR),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;