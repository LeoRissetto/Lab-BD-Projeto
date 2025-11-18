"use client";

import Link from "next/link";
import { CalendarClock, MapPin, Palette, PawPrint, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

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

const interesseSchema = z.object({
  cpf: z
    .string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(11, "CPF deve ter 11 dígitos")
    .regex(/^\d+$/, "Use apenas números"),
  nome: z.string().min(2, "Informe seu nome completo"),
  email: z.string().email("Informe um e-mail válido"),
  telefone: z
    .string()
    .min(8, "Inclua um telefone para contato")
    .max(20, "Telefone muito longo"),
  mensagem: z
    .string()
    .min(10, "Conte um pouco sobre você e sua rotina")
    .max(500, "Deixe sua mensagem mais curta"),
  fotoUrlsRaw: z.string().min(5, "Inclua pelo menos uma URL de foto"),
});

type InteresseForm = z.infer<typeof interesseSchema>;

export default function GatosPublicPage() {
  const [gatos, setGatos] = useState<GatoPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedGato, setSelectedGato] = useState<GatoPublic | null>(null);
  const [feedback, setFeedback] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);
  const [submittingInterest, setSubmittingInterest] = useState(false);

  const form = useForm<InteresseForm>({
    resolver: zodResolver(interesseSchema),
    defaultValues: {
      cpf: "",
      nome: "",
      email: "",
      telefone: "",
      mensagem: "",
      fotoUrlsRaw: "",
    },
  });

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

  useEffect(() => {
    if (selectedGato) {
      form.reset({
        cpf: "",
        nome: "",
        email: "",
        telefone: "",
        mensagem: `Olá! Tenho interesse em conhecer o ${selectedGato.nome}.`,
        fotoUrlsRaw: "",
      });
      setFeedback(null);
    }
  }, [selectedGato, form]);

  function handleOpenInterest(gato: GatoPublic) {
    setSelectedGato(gato);
    setInterestModalOpen(true);
  }

  function handleModalChange(open: boolean) {
    setInterestModalOpen(open);

    if (!open) {
      setSelectedGato(null);
      setFeedback(null);
      form.reset({
        cpf: "",
        nome: "",
        email: "",
        telefone: "",
        mensagem: "",
        fotoUrlsRaw: "",
      });
    }
  }

  async function onSubmit(values: InteresseForm) {
    setSubmittingInterest(true);
    setFeedback(null);

    const fotoUrls = values.fotoUrlsRaw
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);

    if (fotoUrls.length === 0) {
      setFeedback({
        status: "error",
        message: "Inclua ao menos uma URL de foto para a triagem.",
      });
      setSubmittingInterest(false);
      return;
    }

    const payload = {
      cpf: values.cpf,
      nome: values.nome,
      email: values.email,
      telefone: values.telefone,
      mensagem: values.mensagem,
      gatoId: selectedGato?.id ?? null,
      fotoUrls,
    };

    try {
      const { data } = await api.post("/interesses", payload);
      setFeedback({
        status: "success",
        message: "Dados enviados e fotos registradas.",
      });
    } catch (error) {
      setFeedback({
        status: "error",
        message: getApiErrorMessage(error, "Não conseguimos enviar agora. Tente novamente em instantes."),
      });
    } finally {
      setSubmittingInterest(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-transparent via-white/40 to-transparent">
      <Modal
        open={interestModalOpen}
        onOpenChange={handleModalChange}
        title="Tenho interesse em adotar"
        description="Preencha seus dados para combinarmos a entrevista e a visita supervisionada."
      >
        {selectedGato ? (
          <div className="rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              Gato selecionado
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-foreground">{selectedGato.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedGato.raca || "SRD"} •{" "}
                  {selectedGato.idade != null ? `${selectedGato.idade} anos` : "idade não informada"}
                </p>
              </div>
              {selectedGato.cor ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {selectedGato.cor}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seuemail@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do adotante</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" maxLength={11} placeholder="Somente números" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone / WhatsApp</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mensagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem para a equipe</FormLabel>
                  <FormControl>
                    <textarea
                      rows={4}
                      className="min-h-[110px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      placeholder="Conte sobre sua rotina e preparação para receber o peludo :)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fotoUrlsRaw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URLs das fotos da triagem</FormLabel>
                  <FormControl>
                    <textarea
                      rows={3}
                      className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      placeholder="Cole aqui uma ou mais URLs (separe por linha ou vírgula)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                Seus dados ficam seguros e serão usados apenas para esta conversa.
              </p>
              <Button type="submit" disabled={submittingInterest} className="min-w-[160px]">
                {submittingInterest ? "Enviando..." : "Enviar interesse"}
              </Button>
            </div>

            {feedback ? (
              <p
                className={
                  feedback.status === "success" ? "text-sm text-emerald-600" : "text-sm text-destructive"
                }
              >
                {feedback.message}
              </p>
            ) : null}
          </form>
        </Form>
      </Modal>

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

                  <button
                    type="button"
                    onClick={() => handleOpenInterest(g)}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary"
                  >
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
