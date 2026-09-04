import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { updateCategory, softDeleteCategory } from "@/lib/skills/category-management";
import { categoryIdParamSchema, categoryUpdateSchema } from "@/lib/validations/category";

export const PATCH = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = categoryIdParamSchema.parse({ id });
    const body = await req.json();
    const input = categoryUpdateSchema.parse(body);
    const category = await updateCategory(parsed.id, input);
    return ok(category);
  });

export const DELETE = (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = categoryIdParamSchema.parse({ id });
    const category = await softDeleteCategory(parsed.id);
    return ok(category);
  });