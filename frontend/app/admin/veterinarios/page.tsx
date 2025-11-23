"use client";

import { useEffect, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";
import { readUserFromStorage } from "@/lib/auth-storage";

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

export default function AdminVeterinariosPage() {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCpf, setDeletingCpf] = useState<string | null>(null);

  useEffect(() => {
    fetchVeterinarios();
  }, []);

  async function fetchVeterinarios() {
    setLoading(true);
    setError(null);
    try {
      const user = readUserFromStorage();
      const role = user?.tipo?.toLowerCase() ?? "public";
      const { data } = await api.get<Veterinario[]>("/veterinarios", {
        params: { role },
      });
      setVeterinarios(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar veterinários"));
    } finally {
      setLoading(false);
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

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Lista</h2>
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
      </section>
    </div>
  );
}
