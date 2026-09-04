"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/validations/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Email atau password tidak valid." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      // Pesan generik, tidak membedakan email tidak ditemukan vs password salah (F.1)
      return { error: "Email atau password salah" };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
  redirect("/login");
}