import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-guard";
import { getOutOfStockProducts } from "@/lib/skills/inventory";

export const GET = (req: NextRequest) =>
  handle(async () => {
    await requireUser();
    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    const category_id = req.nextUrl.searchParams.get("category_id") ?? undefined;
    const data = await getOutOfStockProducts(
      search ?? undefined,
      category_id ? Number(category_id) : undefined
    );
    return ok(data);
  });