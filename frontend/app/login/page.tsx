import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/90 p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Projeto Lar Temporário
          </p>
          <h1 className="text-3xl font-semibold text-foreground">Entrar</h1>
          <p className="text-sm text-muted-foreground">
            Informe suas credenciais cadastradas via Supabase Auth.
          </p>
        </div>

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Precisa cadastrar usuários? Utilize o painel do Supabase.
        </p>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-primary underline-offset-4 hover:underline"
        >
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
