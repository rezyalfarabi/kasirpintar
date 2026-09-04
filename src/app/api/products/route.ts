import { NextRequest } from "next/server";
import { handle, ok, created } from "@/lib/api-response";
import { requireAdmin, requireUser } from "@/lib/auth-guard";
import { createProduct, listProducts } from "@/lib/skills/product-crud";
import { productCreateSchema, productQuerySchema } from "@/lib/validations/product";

export const GET = (req: NextRequest) =>
  handle(async () => {
    await requireUser();
    const sp = req.nextUrl.searchParams;
    const q = productQuerySchema.parse({
      search: sp.get("search") ?? undefined,
      category_id: sp.get("category_id") ?? undefined,
      stock_status: sp.get("stock_status") ?? undefined,
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
    });
    const result = await listProducts(q);
    return ok(result.data, {
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPage: result.totalPage,
    });
  });

export const POST = (req: NextRequest) =>
  handle(async () => {
    const { userId } = await requireAdmin();
    const body = await req.json();
    const input = productCreateSchema.parse(body);
    const product = await createProduct(input, userId);
    return created(product);
  });