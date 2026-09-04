import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  redirect(session.user.role === Role.ADMIN ? "/dashboard" : "/kasir");
}