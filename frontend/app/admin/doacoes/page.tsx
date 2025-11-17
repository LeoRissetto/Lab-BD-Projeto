"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type Doacao = {
  id: number;
  valor: number;
  data: string;
  nome: string;
  campanha: string | null;
};

type FormState = {
  pessoa_cpf: string;
  valor: string;
  data: string;
  campanha_id: string;
};

const emptyForm: FormState = {
  pessoa_cpf: "",
  valor: "",
  data: "",
  campanha_id: "",
};

export default function AdminDoacoesPage() {
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchDoacoes();
  }, []);

  async function fetchDoacoes() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Doacao[]>("/doacoes");
      setDoacoes(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar doações"));
    } finally {
      setLoading(false);
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
      await api.post("/doacoes", {
        pessoa_cpf: form.pessoa_cpf,
        valor: Number(form.valor),
        data: form.data,
        campanha_id: form.campanha_id ? Number(form.campanha_id) : null,
      });
      setForm(emptyForm);
      await fetchDoacoes();
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao salvar doação"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja remover esta doação?")) return;

    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/doacoes/${id}`);
      setDoacoes((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao remover doação"));
    } finally {
      setDeletingId(null);
    }
  }

  const totalDoado = doacoes.reduce((acc, d) => acc + Number(d.valor), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Doações</h1>
        <p className="text-sm text-muted-foreground">
          Registro financeiro dos apoiadores da ONG.
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
              <h2 className="text-lg font-semibold">Lançamentos</h2>
              <p className="text-sm text-muted-foreground">/doacoes</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">{formatCurrency(totalDoado)}</p>
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : doacoes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma doação registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Doador</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doacoes.map((doacao) => (
                  <TableRow key={doacao.id}>
                    <TableCell>{formatDate(doacao.data)}</TableCell>
                    <TableCell>{doacao.nome}</TableCell>
                    <TableCell>{doacao.campanha ?? "Livre"}</TableCell>
                    <TableCell>{formatCurrency(doacao.valor)}</TableCell>
                    <TableCell className="text-right">
                      <button
                        className="text-xs font-semibold text-foreground hover:underline disabled:opacity-50"
                        onClick={() => handleDelete(doacao.id)}
                        disabled={deletingId === doacao.id}
                      >
                        {deletingId === doacao.id ? "Removendo..." : "Remover"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Registrar doação</h2>
          <p className="text-sm text-muted-foreground">
            Operação básica no endpoint <code className="text-xs">/doacoes</code>.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-muted-foreground">
              CPF
              <Input
                required
                value={form.pessoa_cpf}
                onChange={(e) => handleChange("pessoa_cpf", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Valor
              <Input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.valor}
                onChange={(e) => handleChange("valor", e.target.value)}
              />
            </label>

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
              Campanha (ID opcional)
              <Input
                type="number"
                min="0"
                value={form.campanha_id}
                onChange={(e) => handleChange("campanha_id", e.target.value)}
              />
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Salvando..." : "Registrar doação"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}
