import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-guard";
import { getStockMovements } from "@/lib/skills/inventory";
import { stockIdParamSchema } from "@/lib/validations/stock";

export const GET = (req: NextRequest, { params }: { params: Promise<{ product_id: string }> }) =>
  handle(async () => {
    await requireUser();
    const { product_id } = await params;
    const parsed = stockIdParamSchema.parse({ product_id });
    const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
    const result = await getStockMovements(parsed.product_id, page, limit);
    return ok(result.data, {
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPage: result.totalPage,
    });
  });