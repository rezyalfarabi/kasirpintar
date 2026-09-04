import { NextRequest } from "next/server";
import { handle, ok, created } from "@/lib/api-response";
import { requireAdmin, requireUser } from "@/lib/auth-guard";
import { createCategory, listCategories } from "@/lib/skills/category-management";
import { categoryCreateSchema, categoryQuerySchema } from "@/lib/validations/category";

export const GET = (req: NextRequest) =>
  handle(async () => {
    await requireUser();
    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    const q = categoryQuerySchema.parse({ search });
    const data = await listCategories(q.search);
    return ok(data);
  });

export const POST = (req: NextRequest) =>
  handle(async () => {
    await requireAdmin();
    const body = await req.json();
    const input = categoryCreateSchema.parse(body);
    const category = await createCategory(input);
    return created(category);
  });