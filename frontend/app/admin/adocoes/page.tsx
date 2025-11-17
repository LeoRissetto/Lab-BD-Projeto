"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type Adocao = {
  gato_id: number;
  gato: string;
  adotante_cpf: string;
  adotante: string;
  data: string;
  motivo: string | null;
};

type FormState = {
  gato_id: string;
  adotante_cpf: string;
  data: string;
  motivo: string;
};

const emptyForm: FormState = {
  gato_id: "",
  adotante_cpf: "",
  data: "",
  motivo: "",
};

export default function AdminAdocoesPage() {
  const [adocoes, setAdocoes] = useState<Adocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdocoes();
  }, []);

  async function fetchAdocoes() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Adocao[]>("/adocoes");
      setAdocoes(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar adoções"));
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
      await api.post("/adocoes/registrar", {
        gato_id: Number(form.gato_id),
        adotante_cpf: form.adotante_cpf,
        data: form.data,
        motivo: form.motivo || null,
      });
      setForm(emptyForm);
      await fetchAdocoes();
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao registrar adoção"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Adoções</h1>
        <p className="text-sm text-muted-foreground">
          Lista de adoções realizadas e formulário para registrar novas entradas.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Histórico recente</h2>
          <p className="text-sm text-muted-foreground">
            Dados vindos de <code className="text-xs">/adocoes</code>.
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : adocoes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma adoção registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Gato</TableHead>
                  <TableHead>Adotante</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adocoes.map((adocao) => (
                  <TableRow key={`${adocao.gato_id}-${adocao.data}`}>
                    <TableCell>{formatDate(adocao.data)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{adocao.gato}</span>
                      <p className="text-xs text-muted-foreground">
                        #{adocao.gato_id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{adocao.adotante}</span>
                      <p className="text-xs text-muted-foreground">
                        CPF: {adocao.adotante_cpf}
                      </p>
                    </TableCell>
                    <TableCell>{adocao.motivo ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Registrar adoção</h2>
          <p className="text-sm text-muted-foreground">
            Chama a stored procedure <code className="text-xs">registrar_adocao</code>.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-muted-foreground">
              Gato (ID)
              <Input
                type="number"
                required
                min="1"
                value={form.gato_id}
                onChange={(e) => handleChange("gato_id", e.target.value)}
              />
            </label>

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
              Motivo / observações
              <textarea
                value={form.motivo}
                onChange={(e) => handleChange("motivo", e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
              />
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Registrando..." : "Registrar adoção"}
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
