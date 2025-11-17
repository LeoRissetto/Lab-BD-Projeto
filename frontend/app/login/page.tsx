import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-transparent via-white/40 to-transparent px-6 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 -translate-y-1/3">
        <div className="mx-auto h-full max-w-4xl blur-3xl">
          <div className="h-full w-full rounded-full bg-[radial-gradient(circle,_rgba(255,122,182,0.35),_transparent_60%)]" />
        </div>
      </div>

      <div className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[32px] border border-white/40 bg-gradient-to-br from-[#ff7ab6] via-[#ffa69e] to-[#6fe4cf] p-8 text-white shadow-2xl shadow-primary/30">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/90">
            Painel seguro
          </p>
          <h1 className="mt-3 text-3xl leading-snug">
            Entre para coordenar adoções, doações e relatórios com poucos cliques.
          </h1>
          <p className="mt-4 text-sm text-white/90">
            Autenticação fornecida pelo Supabase garante controle de acesso entre voluntários,
            professores e gestores da ONG.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3 rounded-2xl bg-white/20 px-4 py-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/30 text-sm font-semibold text-primary">
                1
              </span>
              Cadastre gatos, lares e doadores num único lugar.
            </li>
            <li className="flex items-center gap-3 rounded-2xl bg-white/20 px-4 py-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/30 text-sm font-semibold text-primary">
                2
              </span>
              Gere relatórios avançados com consultas SQL prontas.
            </li>
            <li className="flex items-center gap-3 rounded-2xl bg-white/20 px-4 py-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/30 text-sm font-semibold text-primary">
                3
              </span>
              Compartilhe progresso com patrocinadores e a comunidade.
            </li>
          </ul>

          <p className="mt-8 text-xs uppercase tracking-[0.4em] text-white/70">
            Dica
          </p>
          <p className="text-sm text-white">
            Precisa adicionar novos usuários? Acesse o dashboard do Supabase e configure os
            convites por e-mail.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-2xl shadow-primary/10 backdrop-blur">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              Projeto Lar Temporário
            </p>
            <h2 className="text-3xl font-semibold text-foreground">Entrar</h2>
            <p className="text-sm text-muted-foreground">
              Utilize as credenciais cadastradas via Supabase Auth.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Em caso de dúvidas, fale com a coordenação do projeto.
          </p>

          <Link
            href="/"
            className="mt-6 block text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
