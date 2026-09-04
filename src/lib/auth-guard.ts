import { auth } from "./auth";
import { apiError } from "./errors";
import { Role } from "@prisma/client";

/** Pastikan user terautentikasi. Throw ApiError 401 jika tidak. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw apiError("UNAUTHENTICATED", "Silakan login terlebih dahulu");
  }
  return {
    userId: Number(session.user.id),
    role: session.user.role,
    session,
  };
}

/** Pastikan user ber-role ADMIN. Throw 403 untuk Kasir (F.2 default-deny). */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) {
    throw apiError("FORBIDDEN", "Akses khusus Administrator");
  }
  return user;
}