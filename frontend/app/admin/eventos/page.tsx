"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type Evento = {
  id: number;
  nome: string;
  data_inicio: string | null;
  data_fim: string | null;
  cidade: string | null;
  estado: string | null;
};

type FormState = {
  nome: string;
  data_inicio: string;
  data_fim: string;
  endereco_id: string;
};

type EnderecoOption = {
  id: number;
  descricao: string;
};

const emptyForm: FormState = {
  nome: "",
  data_inicio: "",
  data_fim: "",
  endereco_id: "",
};

export default function AdminEventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [enderecos, setEnderecos] = useState<EnderecoOption[]>([]);

  useEffect(() => {
    fetchEventos();
    fetchEnderecos();
  }, []);

  async function fetchEventos() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Evento[]>("/eventos");
      setEventos(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar eventos"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchEnderecos() {
    try {
      const { data } = await api.get<EnderecoOption[]>("/gatos/enderecos");
      setEnderecos(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar endereços"));
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
      await api.post("/eventos", {
        nome: form.nome,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        endereco_id: form.endereco_id ? Number(form.endereco_id) : null,
      });

      setForm(emptyForm);
      await fetchEventos();
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao salvar evento"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja remover este evento?")) return;

    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/eventos/${id}`);
      setEventos((prev) => prev.filter((ev) => ev.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao remover evento"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Eventos</h1>
        <p className="text-sm text-muted-foreground">
          Planeje campanhas de adoção e eventos de arrecadação.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Calendário</h2>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : eventos.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum evento cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.map((evento) => (
                  <TableRow key={evento.id}>
                    <TableCell className="font-medium">{evento.nome}</TableCell>
                    <TableCell>
                      {formatDate(evento.data_inicio)}{" "}
                      {evento.data_fim ? `até ${formatDate(evento.data_fim)}` : ""}
                    </TableCell>
                    <TableCell>
                      {[evento.cidade, evento.estado].filter(Boolean).join(" - ") ||
                        "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        className="text-xs font-semibold text-foreground hover:underline disabled:opacity-50"
                        onClick={() => handleDelete(evento.id)}
                        disabled={deletingId === evento.id}
                      >
                        {deletingId === evento.id ? "Removendo..." : "Remover"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Novo evento</h2>
          <p className="text-sm text-muted-foreground">
            Registra ações públicas ou eventos internos.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-muted-foreground">
              Nome
              <Input
                required
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Data de início
              <Input
                type="date"
                value={form.data_inicio}
                onChange={(e) => handleChange("data_inicio", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Data de término
              <Input
                type="date"
                value={form.data_fim}
                onChange={(e) => handleChange("data_fim", e.target.value)}
              />
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-foreground underline underline-offset-4"
                  onClick={fetchEnderecos}
                  disabled={submitting}
                >
                  Atualizar
                </button>
              </div>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                value={form.endereco_id}
                onChange={(e) => handleChange("endereco_id", e.target.value)}
              >
                <option value="">Selecione um endereço</option>
                {enderecos.map((end) => (
                  <option key={end.id} value={end.id}>
                    #{end.id} — {end.descricao}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Salvando..." : "Cadastrar evento"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Data não definida";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}
