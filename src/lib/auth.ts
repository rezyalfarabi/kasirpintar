import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

/**
 * Auth.js (v5) dengan Credentials provider.
 * Session strategy : JWT (stateless) — menyimpan `id` & `role` user di token.
 * Catatan OD-3: PRD merekomendasikan database session utk force-logout.
 * Menggunakan JWT di MVP karena Credentials provider di Auth.js tidak
 * mendukung database session; dapat dimigrasi ke database session (V1)
 * tanpa mengubah kontrak session (id + role tetap sama di session.user).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.is_active || user.deleted_at) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { role: Role }).role = token.role as Role;
      }
      return session;
    },
  },
});