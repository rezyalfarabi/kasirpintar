import { NextRequest } from "next/server";
import { handle, ok, created } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-guard";
import { listTransactions } from "@/lib/skills/transaction-history";
import { transactionCreateSchema, transactionQuerySchema } from "@/lib/validations/transaction";
import { checkout } from "@/lib/skills/checkout";

export const GET = (req: NextRequest) =>
  handle(async () => {
    const { userId, role } = await requireUser();
    const sp = req.nextUrl.searchParams;
    const q = transactionQuerySchema.parse({
      search: sp.get("search") ?? undefined,
      date_from: sp.get("date_from") ?? undefined,
      date_to: sp.get("date_to") ?? undefined,
      user_id: sp.get("user_id") ?? undefined,
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
    });
    const result = await listTransactions({ ...q, userId, role });
    return ok(result.data, {
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPage: result.totalPage,
    });
  });

export const POST = (req: NextRequest) =>
  handle(async () => {
    const { userId } = await requireUser();
    const body = await req.json();
    const input = transactionCreateSchema.parse(body);
    const result = await checkout(input, userId);
    return created(result);
  });