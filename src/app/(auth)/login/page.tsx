import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow">
        <div className="mb-6 flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold">Kasir Pintar</h1>
          <p className="text-sm text-muted-foreground">Masuk untuk mengakses sistem POS</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}