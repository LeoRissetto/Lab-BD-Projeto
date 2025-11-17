"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type Voluntario = {
  cpf: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco_id: number | null;
  funcoes: string[] | null;
};

type FormState = {
  cpf: string;
  nome: string;
  telefone: string;
  email: string;
  endereco_id: string;
  funcoes: string;
};

const emptyForm: FormState = {
  cpf: "",
  nome: "",
  telefone: "",
  email: "",
  endereco_id: "",
  funcoes: "",
};

export default function AdminVoluntariosPage() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCpf, setDeletingCpf] = useState<string | null>(null);

  useEffect(() => {
    fetchVoluntarios();
  }, []);

  async function fetchVoluntarios() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Voluntario[]>("/voluntarios");
      setVoluntarios(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar voluntários"));
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
      const funcoes = form.funcoes
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      await api.post("/voluntarios", {
        pessoa: {
          cpf: form.cpf,
          nome: form.nome,
          telefone: form.telefone || null,
          email: form.email || null,
          endereco_id: form.endereco_id ? Number(form.endereco_id) : null,
        },
        dados: {
          cpf: form.cpf,
          funcoes,
        },
      });

      setForm(emptyForm);
      await fetchVoluntarios();
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao salvar voluntário"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(cpf: string) {
    if (!window.confirm("Deseja remover este voluntário?")) {
      return;
    }

    setDeletingCpf(cpf);
    setError(null);
    try {
      await api.delete(`/voluntarios/${cpf}`);
      setVoluntarios((prev) => prev.filter((vol) => vol.cpf !== cpf));
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao remover voluntário"));
    } finally {
      setDeletingCpf(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Voluntários</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre voluntários e atribua funções como transporte, triagem ou lar temporário.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Lista</h2>
              <p className="text-sm text-muted-foreground">Endpoint /voluntarios</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {voluntarios.length} registro(s)
            </span>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : voluntarios.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum voluntário cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Funções</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voluntarios.map((vol) => (
                  <TableRow key={vol.cpf}>
                    <TableCell>
                      <span className="font-medium">{vol.nome}</span>
                      <p className="text-xs text-muted-foreground">CPF: {vol.cpf}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{vol.email ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {vol.telefone ?? "Sem telefone"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {vol.funcoes?.length
                        ? vol.funcoes.join(", ")
                        : "Sem funções registradas"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        className="text-xs font-semibold text-foreground hover:underline disabled:opacity-50"
                        onClick={() => handleDelete(vol.cpf)}
                        disabled={deletingCpf === vol.cpf}
                      >
                        {deletingCpf === vol.cpf ? "Removendo..." : "Remover"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Novo voluntário</h2>
          <p className="text-sm text-muted-foreground">
            Cria registros em <code className="text-xs">pessoa</code> e <code className="text-xs">voluntario</code>.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-muted-foreground">
              CPF
              <Input
                required
                value={form.cpf}
                onChange={(e) => handleChange("cpf", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Nome
              <Input
                required
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Telefone
              <Input
                value={form.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              E-mail
              <Input
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                type="email"
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Endereço (ID)
              <Input
                type="number"
                min="0"
                value={form.endereco_id}
                onChange={(e) => handleChange("endereco_id", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Funções (separadas por vírgula)
              <Input
                value={form.funcoes}
                onChange={(e) => handleChange("funcoes", e.target.value)}
                placeholder="ex: transporte, visitas"
              />
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Salvando..." : "Adicionar voluntário"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
