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

type GatoDisponivel = {
  id: number;
  nome: string;
  raca: string | null;
};

type AdotanteOption = {
  cpf: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  procurando_gato: boolean;
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
  const [gatosDisponiveis, setGatosDisponiveis] = useState<GatoDisponivel[]>([]);
  const [adotantes, setAdotantes] = useState<AdotanteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdocoes();
    fetchGatosDisponiveis();
    fetchAdotantes();
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

  async function fetchGatosDisponiveis() {
    try {
      const { data } = await api.get<{ rows: GatoDisponivel[] }>("/queries/gatos_disponiveis");
      setGatosDisponiveis(data.rows);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar gatos disponíveis"));
    }
  }

  async function fetchAdotantes() {
    try {
      const { data } = await api.get<AdotanteOption[]>("/adocoes/adotantes");
      setAdotantes(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar adotantes"));
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-muted-foreground">Gato disponível</label>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-primary underline underline-offset-4"
                  onClick={fetchGatosDisponiveis}
                  disabled={submitting}
                >
                  Atualizar
                </button>
              </div>
              <select
                required
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                value={form.gato_id}
                onChange={(e) => handleChange("gato_id", e.target.value)}
              >
                <option value="">Selecione um gato</option>
                {gatosDisponiveis.map((g) => (
                  <option key={g.id} value={g.id}>
                    #{g.id} — {g.nome} {g.raca ? `(${g.raca})` : ""}
                  </option>
                ))}
              </select>
              {form.gato_id === "" ? (
                <p className="text-xs text-muted-foreground">Mostra apenas gatos não adotados.</p>
              ) : null}
            </div>

            <label className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Adotante</span>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-primary underline underline-offset-4"
                  onClick={fetchAdotantes}
                  disabled={submitting}
                >
                  Atualizar
                </button>
              </div>
              <select
                required
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                value={form.adotante_cpf}
                onChange={(e) => handleChange("adotante_cpf", e.target.value)}
              >
                <option value="">Selecione um adotante</option>
                {adotantes.map((a) => (
                  <option key={a.cpf} value={a.cpf}>
                    {a.nome} — CPF {a.cpf} {a.procurando_gato ? "(procurando)" : ""}
                  </option>
                ))}
              </select>
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
