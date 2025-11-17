"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type Triagem = {
  adotante_cpf: string;
  adotante: string;
  data: string;
  resultado: string | null;
  responsavel: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTriagens();
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
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao registrar triagem"));
    } finally {
      setSubmitting(false);
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
          <p className="text-sm text-muted-foreground">
            Endpoint <code className="text-xs">/triagem</code> com junções.
          </p>

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
          <p className="text-sm text-muted-foreground">
            Salva diretamente na tabela <code className="text-xs">triagem</code>.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-muted-foreground">
              CPF do adotante
              <Input
                required
                value={form.adotante_cpf}
                onChange={(e) => handleChange("adotante_cpf", e.target.value)}
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
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}
