"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type Ocupacao = {
  lar_id: number;
  cidade: string | null;
  estado: string | null;
  capacidade_maxima: number | null;
  gatos_hospedados: number;
  vagas_disponiveis: number;
};

type FormState = {
  endereco_id: string;
  capacidade_maxima: string;
  responsavel_cpf: string;
};

type EnderecoOption = {
  id: number;
  descricao: string;
};

const emptyForm: FormState = {
  endereco_id: "",
  capacidade_maxima: "",
  responsavel_cpf: "",
};

export default function AdminLaresPage() {
  const [ocupacao, setOcupacao] = useState<Ocupacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [enderecos, setEnderecos] = useState<EnderecoOption[]>([]);

  useEffect(() => {
    fetchLares();
    fetchEnderecos();
  }, []);

  async function fetchLares() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Ocupacao[]>("/lares/ocupacao");
      setOcupacao(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar lares"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchEnderecos() {
    try {
      const { data } = await api.get<EnderecoOption[]>("/lares/enderecos");
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
      await api.post("/lares", {
        endereco_id: Number(form.endereco_id),
        capacidade_maxima: form.capacidade_maxima
          ? Number(form.capacidade_maxima)
          : null,
        responsavel_cpf: form.responsavel_cpf || null,
      });

      setForm(emptyForm);
      await fetchLares();
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao cadastrar lar"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja remover este lar?")) return;

    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/lares/${id}`);
      setOcupacao((prev) => prev.filter((oc) => oc.lar_id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao remover lar"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Lares temporários</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro e monitoramento das casas de acolhimento.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ocupação atual</h2>
              <p className="text-sm text-muted-foreground">Endpoint /lares/ocupacao</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {ocupacao.length} lar(es)
            </span>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : ocupacao.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum lar cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lar</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Hospedados</TableHead>
                  <TableHead>Vagas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ocupacao.map((lar) => (
                  <TableRow key={lar.lar_id}>
                    <TableCell>#{lar.lar_id}</TableCell>
                    <TableCell>
                      {[lar.cidade, lar.estado].filter(Boolean).join(" - ") || "—"}
                    </TableCell>
                    <TableCell>{lar.capacidade_maxima ?? "—"}</TableCell>
                    <TableCell>{lar.gatos_hospedados}</TableCell>
                    <TableCell>{lar.vagas_disponiveis}</TableCell>
                    <TableCell className="text-right">
                      <button
                        className="text-xs font-semibold text-foreground hover:underline disabled:opacity-50"
                        onClick={() => handleDelete(lar.lar_id)}
                        disabled={deletingId === lar.lar_id}
                      >
                        {deletingId === lar.lar_id ? "Removendo..." : "Remover"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Novo lar</h2>
          <p className="text-sm text-muted-foreground">
            Insere dados na tabela <code className="text-xs">lar_temporario</code>.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-primary underline underline-offset-4"
                  onClick={fetchEnderecos}
                  disabled={submitting}
                >
                  Atualizar
                </button>
              </div>
              <select
                required
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

            <label className="text-sm font-medium text-muted-foreground">
              Capacidade máxima
              <Input
                type="number"
                min="0"
                value={form.capacidade_maxima}
                onChange={(e) =>
                  handleChange("capacidade_maxima", e.target.value)
                }
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              CPF do responsável
              <Input
                value={form.responsavel_cpf}
                onChange={(e) => handleChange("responsavel_cpf", e.target.value)}
              />
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Salvando..." : "Cadastrar lar"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
