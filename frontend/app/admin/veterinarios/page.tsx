"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type Veterinario = {
  cpf: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco_id: number | null;
  crmv: string;
  especialidade: string | null;
  clinica: string | null;
};

type FormState = {
  cpf: string;
  nome: string;
  telefone: string;
  email: string;
  endereco_id: string;
  crmv: string;
  especialidade: string;
  clinica: string;
};

const emptyForm: FormState = {
  cpf: "",
  nome: "",
  telefone: "",
  email: "",
  endereco_id: "",
  crmv: "",
  especialidade: "",
  clinica: "",
};

export default function AdminVeterinariosPage() {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCpf, setDeletingCpf] = useState<string | null>(null);

  useEffect(() => {
    fetchVeterinarios();
  }, []);

  async function fetchVeterinarios() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Veterinario[]>("/veterinarios");
      setVeterinarios(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar veterinários"));
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
      await api.post("/veterinarios", {
        pessoa: {
          cpf: form.cpf,
          nome: form.nome,
          telefone: form.telefone || null,
          email: form.email || null,
          endereco_id: form.endereco_id ? Number(form.endereco_id) : null,
        },
        vet: {
          cpf: form.cpf,
          crmv: form.crmv,
          especialidade: form.especialidade || null,
          clinica: form.clinica || null,
        },
      });

      setForm(emptyForm);
      await fetchVeterinarios();
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao salvar veterinário"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(cpf: string) {
    if (!window.confirm("Deseja remover este veterinário?")) return;

    setDeletingCpf(cpf);
    setError(null);
    try {
      await api.delete(`/veterinarios/${cpf}`);
      setVeterinarios((prev) => prev.filter((vet) => vet.cpf !== cpf));
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao remover veterinário"));
    } finally {
      setDeletingCpf(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Veterinários</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro de profissionais parceiros e suas especialidades.
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
              <h2 className="text-lg font-semibold">Lista</h2>
              <p className="text-sm text-muted-foreground">Endpoint /veterinarios</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {veterinarios.length} registro(s)
            </span>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : veterinarios.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum registro.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CRMV</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {veterinarios.map((vet) => (
                  <TableRow key={vet.cpf}>
                    <TableCell>
                      <div className="font-medium">{vet.nome}</div>
                      <p className="text-xs text-muted-foreground">CPF: {vet.cpf}</p>
                    </TableCell>
                    <TableCell>{vet.crmv}</TableCell>
                    <TableCell>{vet.especialidade ?? "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{vet.email ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {vet.telefone ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        className="text-xs font-semibold text-foreground hover:underline disabled:opacity-50"
                        onClick={() => handleDelete(vet.cpf)}
                        disabled={deletingCpf === vet.cpf}
                      >
                        {deletingCpf === vet.cpf ? "Removendo..." : "Remover"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Novo veterinário</h2>
          <p className="text-sm text-muted-foreground">
            Insere dados nas tabelas <code className="text-xs">pessoa</code> e{" "}
            <code className="text-xs">veterinario</code>.
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
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
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
              CRMV
              <Input
                required
                value={form.crmv}
                onChange={(e) => handleChange("crmv", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Especialidade
              <Input
                value={form.especialidade}
                onChange={(e) => handleChange("especialidade", e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-muted-foreground">
              Clínica
              <Input
                value={form.clinica}
                onChange={(e) => handleChange("clinica", e.target.value)}
              />
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Salvando..." : "Adicionar veterinário"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
