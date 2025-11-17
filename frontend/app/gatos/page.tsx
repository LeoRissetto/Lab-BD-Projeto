"use client";

import Link from "next/link";
import { CalendarClock, MapPin, Palette, PawPrint, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { api, getApiErrorMessage } from "@/lib/api";

type GatoPublic = {
  id: number;
  nome: string;
  idade: number | null;
  cor: string | null;
  raca: string | null;
  cidade_resgate?: string | null;
  estado_resgate?: string | null;
};

type QueryResponse = {
  rows: GatoPublic[];
};

export default function GatosPublicPage() {
  const [gatos, setGatos] = useState<GatoPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<QueryResponse>("/queries/gatos_disponiveis");
        setGatos(data.rows);
      } catch (error) {
        setErro(getApiErrorMessage(error, "Erro ao carregar gatos"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-transparent via-white/40 to-transparent">
      <header className="relative overflow-hidden border-b border-transparent bg-gradient-to-br from-[#ff7ab6] via-[#ffa69e] to-[#6fe4cf] text-white shadow-lg">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_60%)]" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-white md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.5em]">ONG Lar Temporário</p>
            <h1 className="text-3xl font-semibold md:text-4xl">Gatos disponíveis para adoção</h1>
            <p className="text-sm text-white/90">
              Uma vitrine colorida para conectar famílias amorosas a peludos cheios de personalidade.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/30"
            >
              Área administrativa
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/20"
            >
              Página inicial
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="rounded-3xl border border-primary/20 bg-white/80 px-6 py-5 shadow-lg shadow-primary/10 backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              {gatos.length > 0 ? `${gatos.length} gatinhos esperando por você` : "Lista sempre atualizada"}
            </div>
            <p className="text-muted-foreground">
              Perfis sincronizados diretamente com o banco do projeto via Supabase.
            </p>
          </div>
        </div>

        {erro && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
            {erro}
          </p>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/60 bg-white/70 px-5 py-10 text-center shadow-md shadow-primary/10">
            <p className="text-sm text-muted-foreground">Carregando ronrons…</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gatos.map((g) => {
              const localizacao = [g.cidade_resgate, g.estado_resgate].filter(Boolean).join(" - ");
              return (
                <article
                  key={g.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-5 shadow-xl shadow-primary/10 backdrop-blur transition hover:-translate-y-1"
                >
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-foreground">{g.nome}</h3>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {g.raca || "SRD"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                      {g.idade != null ? `${g.idade} anos` : "Idade não informada"}
                    </p>

                    {g.cor && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Palette className="h-4 w-4 text-primary" />
                        <span>Pelagem {g.cor.toLowerCase()}</span>
                      </div>
                    )}

                    {localizacao && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-secondary" />
                        <span>Resgatado em {localizacao}</span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="h-4 w-4 text-accent" />
                      <span>Pronto para visitas acompanhadas</span>
                    </div>
                  </div>

                  <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary">
                    <PawPrint className="h-4 w-4" />
                    Tenho interesse
                  </button>

                  <div className="pointer-events-none absolute -bottom-6 -right-4 h-16 w-16 rounded-full bg-primary/10 blur-xl transition group-hover:scale-110" />
                </article>
              );
            })}

            {gatos.length === 0 && (
              <div className="rounded-3xl border border-white/70 bg-white/90 px-6 py-10 text-center shadow-xl shadow-primary/10 backdrop-blur">
                <p className="text-base font-semibold text-foreground">Nenhum gato disponível agora.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Todos os peludos encontraram famílias! Volte em breve ou acompanhe nossas redes. 💛
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
