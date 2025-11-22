"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type Triagem = {
  adotante_cpf: string;
  adotante: string;
  data: string;
  resultado: string | null;
  responsavel: string;
};

type AdotantePendente = {
  cpf: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  fotos: number;
};

type FormState = {
  adotante_cpf: string;
  data: string;
  responsavel_cpf: string;
  resultado: string;
};

const emptyForm: FormState = {
  adotante_cpf: "",
  data: "",
  responsavel_cpf: "",
  resultado: "",
};

export default function AdminTriagemPage() {
  const [triagens, setTriagens] = useState<Triagem[]>([]);
  const [pendentes, setPendentes] = useState<AdotantePendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPendentes, setLoadingPendentes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [fotosModal, setFotosModal] = useState<{
    open: boolean;
    cpf: string | null;
    nome: string | null;
    urls: string[];
    loading: boolean;
    error: string | null;
  }>({
    open: false,
    cpf: null,
    nome: null,
    urls: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    fetchTriagens();
    fetchPendentes();
  }, []);

  async function fetchTriagens() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Triagem[]>("/triagem");
      setTriagens(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar triagens"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchPendentes() {
    setLoadingPendentes(true);
    try {
      const { data } = await api.get<AdotantePendente[]>("/triagem/pendentes");
      setPendentes(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar adotantes pendentes"));
    } finally {
      setLoadingPendentes(false);
    }
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/triagem", {
        adotante_cpf: form.adotante_cpf,
        data: form.data,
        responsavel_cpf: form.responsavel_cpf,
        resultado: form.resultado || null,
      });
      setForm(emptyForm);
      await fetchTriagens();
      await fetchPendentes();
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao registrar triagem"));
    } finally {
      setSubmitting(false);
    }
  }

  async function abrirFotos(cpf: string, nome: string) {
    setFotosModal({
      open: true,
      cpf,
      nome,
      urls: [],
      loading: true,
      error: null,
    });
    try {
      const { data } = await api.get<{ foto_url: string }[]>(`/triagem/${cpf}/fotos`);
      setFotosModal((prev) => ({ ...prev, urls: data.map((i) => i.foto_url) || [], loading: false }));
    } catch (err) {
      setFotosModal((prev) => ({
        ...prev,
        loading: false,
        error: getApiErrorMessage(err, "Erro ao carregar fotos"),
      }));
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Triagens</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe entrevistas com adotantes e registre novos resultados.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Histórico</h2>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : triagens.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma triagem registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Adotante</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triagens.map((triagem) => (
                  <TableRow key={`${triagem.adotante_cpf}-${triagem.data}`}>
                    <TableCell>{formatDate(triagem.data)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{triagem.adotante}</span>
                      <p className="text-xs text-muted-foreground">
                        CPF: {triagem.adotante_cpf}
                      </p>
                    </TableCell>
                    <TableCell>{triagem.responsavel}</TableCell>
                    <TableCell>{triagem.resultado ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Registrar triagem</h2>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-muted-foreground">Adotante pendente</label>
                {loadingPendentes ? (
                  <span className="text-[11px] text-muted-foreground">carregando…</span>
                ) : (
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-foreground underline underline-offset-4"
                    onClick={fetchPendentes}
                  >
                    Atualizar lista
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <select
                  required
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={form.adotante_cpf}
                  onChange={(e) => handleChange("adotante_cpf", e.target.value)}
                >
                  <option value="">Selecione um adotante</option>
                  {pendentes.map((p) => (
                    <option key={p.cpf} value={p.cpf}>
                      {p.nome} — CPF {p.cpf} {p.fotos ? `(${p.fotos} fotos)` : ""}
                    </option>
                  ))}
                </select>
                {form.adotante_cpf ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const adotante = pendentes.find((p) => p.cpf === form.adotante_cpf);
                        abrirFotos(form.adotante_cpf, adotante?.nome || "");
                      }}
                      disabled={submitting}
                    >
                      Ver fotos enviadas
                    </Button>
                    <span>
                      {pendentes.find((p) => p.cpf === form.adotante_cpf)?.email || "sem e-mail"} •{" "}
                      {pendentes.find((p) => p.cpf === form.adotante_cpf)?.telefone || "sem telefone"}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Escolha um adotante pendente para triagem.</p>
                )}
              </div>
            </div>

            <label className="text-sm font-medium text-muted-foreground">
              Data
              <Input
                type="date"
                required
                value={form.data}
                onChange={(e) => handleChange("data", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              CPF do responsável
              <Input
                required
                value={form.responsavel_cpf}
                onChange={(e) => handleChange("responsavel_cpf", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Resultado
              <textarea
                value={form.resultado}
                onChange={(e) => handleChange("resultado", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Salvando..." : "Registrar triagem"}
            </Button>
          </form>
        </div>
      </section>

      <Modal
        open={fotosModal.open}
        onOpenChange={(open) =>
          setFotosModal((prev) => ({
            ...prev,
            open,
          }))
        }
        title={fotosModal.nome || "Fotos enviadas"}
        description={fotosModal.cpf ? `CPF: ${fotosModal.cpf}` : ""}
      >
        {fotosModal.loading ? (
          <p className="text-sm text-muted-foreground">Carregando fotos...</p>
        ) : fotosModal.error ? (
          <p className="text-sm text-destructive">{fotosModal.error}</p>
        ) : fotosModal.urls.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma foto enviada para este adotante.</p>
        ) : (
          <div className="space-y-2">
            {fotosModal.urls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block truncate rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-primary underline-offset-4 hover:underline"
              >
                {url}
              </a>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}
