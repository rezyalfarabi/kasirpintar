import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-guard";
import { getTransactionDetail } from "@/lib/skills/transaction-history";
import { transactionIdParamSchema } from "@/lib/validations/transaction";

export const GET = (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const { userId, role } = await requireUser();
    const { id } = await params;
    const parsed = transactionIdParamSchema.parse({ id });
    const detail = await getTransactionDetail(parsed.id, userId, role);
    return ok(detail);
  });