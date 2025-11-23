"use client";

import { useEffect, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";
import { readUserFromStorage } from "@/lib/auth-storage";

type Voluntario = {
  cpf: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco_id: number | null;
  funcoes: string[] | null;
};

export default function AdminVoluntariosPage() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCpf, setDeletingCpf] = useState<string | null>(null);

  useEffect(() => {
    fetchVoluntarios();
  }, []);

  async function fetchVoluntarios() {
    setLoading(true);
    setError(null);
    try {
      const user = readUserFromStorage();
      const role = user?.tipo?.toLowerCase() ?? "public";
      const { data } = await api.get<Voluntario[]>("/voluntarios", {
        params: { role },
      });
      setVoluntarios(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar voluntários"));
    } finally {
      setLoading(false);
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

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Lista</h2>
          </div>
          <span className="text-xs text-muted-foreground">{voluntarios.length} registro(s)</span>
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
                    {vol.funcoes?.length ? vol.funcoes.join(", ") : "Sem funções registradas"}
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
      </section>
    </div>
  );
}
