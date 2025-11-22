"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type Gasto = {
  id: number;
  tipo: string;
  valor: number;
  data: string;
  descricao: string | null;
  lar_id: number | null;
  cidade: string | null;
  estado: string | null;
};

type FormState = {
  lar_id: string;
  tipo: string;
  valor: string;
  data: string;
  descricao: string;
};

type LarOption = {
  id: number;
  cidade: string | null;
  estado: string | null;
};

const emptyForm: FormState = {
  lar_id: "",
  tipo: "",
  valor: "",
  data: "",
  descricao: "",
};

export default function AdminGastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [lares, setLares] = useState<LarOption[]>([]);

  useEffect(() => {
    fetchGastos();
    fetchLaresOptions();
  }, []);

  async function fetchGastos() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Gasto[]>("/gastos");
      setGastos(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar gastos"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchLaresOptions() {
    try {
      const { data } = await api.get<LarOption[]>("/lares");
      setLares(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar lares"));
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
      await api.post("/gastos", {
        lar_id: form.lar_id ? Number(form.lar_id) : null,
        tipo: form.tipo,
        valor: Number(form.valor),
        data: form.data,
        descricao: form.descricao || null,
      });

      setForm(emptyForm);
      await fetchGastos();
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao registrar gasto"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja remover este gasto?")) return;

    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/gastos/${id}`);
      setGastos((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao remover gasto"));
    } finally {
      setDeletingId(null);
    }
  }

  const totalGasto = gastos.reduce((acc, gasto) => acc + Number(gasto.valor), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Gastos</h1>
        <p className="text-sm text-muted-foreground">
          Controle financeiro dos lares temporários.
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
              <h2 className="text-lg font-semibold">Últimos lançamentos</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">
                {formatCurrency(totalGasto)}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : gastos.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum gasto registrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Lar</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell>{formatDate(gasto.data)}</TableCell>
                    <TableCell className="font-medium">{gasto.tipo}</TableCell>
                    <TableCell>
                      {gasto.lar_id
                        ? `#${gasto.lar_id} ${
                            [gasto.cidade, gasto.estado].filter(Boolean).join(" - ") || ""
                          }`
                        : "—"}
                    </TableCell>
                    <TableCell>{formatCurrency(gasto.valor)}</TableCell>
                    <TableCell>{gasto.descricao ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <button
                        className="text-xs font-semibold text-foreground hover:underline disabled:opacity-50"
                        onClick={() => handleDelete(gasto.id)}
                        disabled={deletingId === gasto.id}
                      >
                        {deletingId === gasto.id ? "Removendo..." : "Remover"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Registrar gasto</h2>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-muted-foreground">Lar</label>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-foreground underline underline-offset-4"
                  onClick={fetchLaresOptions}
                  disabled={submitting}
                >
                  Atualizar
                </button>
              </div>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                value={form.lar_id}
                onChange={(e) => handleChange("lar_id", e.target.value)}
              >
                <option value="">Sem vínculo</option>
                {lares.map((lar) => (
                  <option key={lar.id} value={lar.id}>
                    #{lar.id} { [lar.cidade, lar.estado].filter(Boolean).join(" - ") }
                  </option>
                ))}
              </select>
            </div>

            <label className="text-sm font-medium text-muted-foreground">
              Tipo
              <Input
                required
                value={form.tipo}
                onChange={(e) => handleChange("tipo", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Valor
              <Input
                required
                type="number"
                min="0"
                step="0.01"
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
              Descrição
              <textarea
                value={form.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
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
              {submitting ? "Salvando..." : "Cadastrar gasto"}
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
