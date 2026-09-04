import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-guard";
import { findProductByBarcode } from "@/lib/skills/product-search";
import { apiError } from "@/lib/errors";
import { z } from "zod";

const barcodeSearchSchema = z.object({
  barcode: z.string().trim().min(1).max(64),
});

export const POST = (req: NextRequest) =>
  handle(async () => {
    await requireUser();
    const body = await req.json();
    const { barcode } = barcodeSearchSchema.parse(body);
    const product = await findProductByBarcode(barcode);
    if (!product) {
      throw apiError("BARCODE_NOT_REGISTERED", "Produk belum terdaftar");
    }
    return ok(product);
  });