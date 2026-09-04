import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { adjustStock } from "@/lib/skills/inventory";
import { stockAdjustmentSchema } from "@/lib/validations/stock";

export const POST = (req: NextRequest) =>
  handle(async () => {
    const { userId } = await requireAdmin();
    const body = await req.json();
    const input = stockAdjustmentSchema.parse(body);
    const result = await adjustStock(
      input.product_id,
      input.type,
      input.quantity,
      userId,
      input.note
    );
    return ok(result);
  });