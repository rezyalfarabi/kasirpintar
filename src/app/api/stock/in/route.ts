import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { addStock } from "@/lib/skills/inventory";
import { stockInSchema } from "@/lib/validations/stock";

export const POST = (req: NextRequest) =>
  handle(async () => {
    const { userId } = await requireAdmin();
    const body = await req.json();
    const input = stockInSchema.parse(body);
    const result = await addStock(input.product_id, input.quantity, userId, input.note);
    return ok(result);
  });