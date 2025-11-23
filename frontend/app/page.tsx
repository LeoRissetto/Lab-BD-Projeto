"use client";

import Link from "next/link";
import {
  Cat,
  Gift,
  Heart,
  PawPrint,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  SunMedium,
} from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";

type Status = "loading" | "ok" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verificando backend...");

  useEffect(() => {
    async function checkBackend() {
      try {
        await api.get("/health/supabase");
        setStatus("ok");
        setMessage("Conectado ao FastAPI e Supabase.");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage("Não foi possível comunicar com o backend.");
      }
    }
    checkBackend();
  }, []);

  const stats = [
    { value: "420+", label: "peludos resgatados" },
    { value: "68", label: "lares temporários ativos" },
    { value: "12", label: "eventos por semestre" },
  ];

  const featureHighlights = [
    {
      title: "Galeria viva",
      description: "Cards mostram gatos disponíveis para adoção.",
      tag: "Histórias reais",
      icon: Cat,
      colors: "from-[#ffd6f0] via-white to-white",
    },
    {
      title: "Facilidades",
      description: "Relatórios diversos para Administradores",
      tag: "Confiança",
      icon: ShieldCheck,
      colors: "from-[#d5f7f1] via-white to-white",
    },
    {
      title: "Mutirões e visitas",
      description: "Agenda administrativa registra eventos.",
      tag: "Agenda ativa",
      icon: SunMedium,
      colors: "from-[#fff1c9] via-white to-white",
    },
    {
      title: "Rede de carinho",
      description: "Voluntários conseguem demonstrar seus interesses em adotar gatinhos.",
      tag: "Comunidade",
      icon: Heart,
      colors: "from-[#ffe0d7] via-white to-white",
    },
  ];

  const adoptionSteps = [
    {
      step: "1",
      title: "Conheça os peludos",
      description: "Explore o catálogo com filtros e fotos afetivas de cada gato.",
      gradient: "from-[#ffd6f0]/70 to-transparent",
    },
    {
      step: "2",
      title: "Converse com a equipe",
      description: "Voluntários entram em contato para entender seu perfil e rotina.",
      gradient: "from-[#d5f7f1]/70 to-transparent",
    },
    {
      step: "3",
      title: "Prepare o lar",
      description: "Receba uma lista interativa com itens essenciais para a adaptação.",
      gradient: "from-[#fff1c9]/80 to-transparent",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-transparent via-white/40 to-transparent">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] -translate-y-1/3 overflow-hidden">
        <div className="mx-auto h-full max-w-5xl blur-3xl">
          <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_top,_rgba(255,122,182,0.45),_transparent_60%)]" />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <section className="grid gap-12 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.45em] text-primary shadow-sm shadow-primary/15">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              Lar Temporário
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
                <span className="bg-gradient-to-r from-[#ff7ab6] via-[#ffa69e] to-[#6fe4cf] bg-clip-text text-transparent">
                  Um abrigo cheio de alegria e amor.
                </span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg whitespace-nowrap">
                Plataforma completa para conectar gatinhos resgatados a acolhedoras famílias.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/gatos"
                className="inline-flex items-center gap-2 rounded-full bg-primary/90 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:bg-primary"
              >
                <PawPrint className="h-4 w-4" />
                Ver gatos disponíveis
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-white/80 px-5 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:border-primary hover:bg-white"
              >
                <ShieldCheck className="h-4 w-4 text-secondary" />
                Painel Administrador
              </Link>
            </div>

     
          </div>

    
              <section className="mt-1 space-y-5">

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featureHighlights.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className={`group h-full rounded-3xl border border-white/60 bg-gradient-to-br ${feature.colors} p-5 shadow-xl shadow-primary/10 transition hover:-translate-y-1`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                    {feature.tag}
                    <span className="text-primary opacity-70">•</span>
                  </div>
                  <div className="mt-4 inline-flex rounded-2xl bg-white/70 p-3 text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-xl text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

           
        </section>

      

        <footer className="mt-20 rounded-[32px] border border-white/60 bg-white/80 p-8 text-sm text-foreground shadow-2xl shadow-primary/10 backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Desenvolvido com carinho
              </p>
              <h4 className="mt-2 text-xl font-semibold">
                Leonardo Gueno • Luciano Filho • Pedro Zenatte • Rauany Secci
              </h4>
              <p className="mt-1 text-muted-foreground">
                FastAPI, PostgreSQL, Supabase e Next.js trabalhando juntos para impulsionar adoções.
              </p>
            </div>
            <div className="space-y-2 text-muted-foreground">
              <p>Repositório: <a href="https://github.com/LeoRissetto/Lab-BD-Projeto" target="_blank" rel="noopener noreferrer" className="rounded bg-muted px-2 py-1 text-xs text-foreground underline-offset-2 hover:underline">Lab-BD-Projeto</a></p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
