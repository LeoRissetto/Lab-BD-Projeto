import Link from "next/link";

import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  const isConnected = !error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card/90 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Projeto Lar Temporário
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Supabase {isConnected ? "conectado" : "indisponível"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este cartão mostra o estado atual da conexão e a sessão disponível
          para que você possa continuar desenvolvendo o restante do sistema.
        </p>

        <div className="mt-8 space-y-3 rounded-xl border border-dashed border-border/70 bg-secondary/60 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-foreground">
              {isConnected ? "Conectado" : "Erro ao conectar"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Sessão</span>
            <span className="font-medium text-foreground">
              {session?.user?.email ?? "Nenhuma sessão"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">URL do projeto</span>
            <span className="font-medium text-foreground">
              {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </span>
          </div>
          {error ? (
            <p className="text-xs text-destructive">{error.message}</p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          {session ? (
            <form action={logout}>
              <Button type="submit" variant="destructive">
                Sair
              </Button>
            </form>
          ) : (
            <Button asChild variant="outline">
              <Link href="/login">Ir para login</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
