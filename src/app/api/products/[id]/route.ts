import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { getProductById, updateProduct, softDeleteProduct } from "@/lib/skills/product-crud";
import { productIdParamSchema, productUpdateSchema } from "@/lib/validations/product";

export const GET = (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const { id } = await params;
    const parsed = productIdParamSchema.parse({ id });
    const product = await getProductById(parsed.id);
    return ok(product);
  });

export const PATCH = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = productIdParamSchema.parse({ id });
    const body = await req.json();
    const input = productUpdateSchema.parse(body);
    const product = await updateProduct(parsed.id, input);
    return ok(product);
  });

export const DELETE = (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = productIdParamSchema.parse({ id });
    const product = await softDeleteProduct(parsed.id);
    return ok(product);
  });