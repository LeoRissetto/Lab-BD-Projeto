"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

import { GatoFormValues, GatoModal } from "./modal";

type Gato = {
  id: number;
  nome: string;
  idade: number | null;
  data_resgate: string | null;
  endereco_resgate_id: number | null;
  cor: string | null;
  raca: string | null;
  condicao_saude: string | null;
};

type EnderecoOption = {
  id: number;
  descricao: string;
};

const emptyForm: GatoFormValues = {
  nome: "",
  idade: "",
  data_resgate: "",
  endereco_resgate_id: "",
  cor: "",
  raca: "",
  condicao_saude: "",
};

export default function AdminGatosPage() {
  const [gatos, setGatos] = useState<Gato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Gato | null>(null);
  const [form, setForm] = useState<GatoFormValues>(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [enderecos, setEnderecos] = useState<EnderecoOption[]>([]);

  useEffect(() => {
    fetchGatos();
    fetchEnderecos();
  }, []);

  async function fetchGatos() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Gato[]>("/gatos");
      setGatos(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar gatos"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchEnderecos() {
    try {
      const { data } = await api.get<EnderecoOption[]>("/gatos/enderecos");
      setEnderecos(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar endereços"));
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(gato: Gato) {
    setEditing(gato);
    setForm({
      nome: gato.nome ?? "",
      idade: gato.idade?.toString() ?? "",
      data_resgate: gato.data_resgate ?? "",
      endereco_resgate_id: gato.endereco_resgate_id?.toString() ?? "",
      cor: gato.cor ?? "",
      raca: gato.raca ?? "",
      condicao_saude: gato.condicao_saude ?? "",
    });
    setModalOpen(true);
  }

  function handleChange(field: keyof GatoFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = mapFormToPayload(form);

      if (editing) {
        await api.put(`/gatos/${editing.id}`, payload);
      } else {
        await api.post("/gatos", payload);
      }

      setModalOpen(false);
      await fetchGatos();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível salvar o registro"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja realmente remover este gato?")) {
      return;
    }

    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/gatos/${id}`);
      setGatos((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao remover gato"));
    } finally {
      setDeletingId(null);
    }
  }

  const subtitle = useMemo(() => {
    const total = gatos.length;
    if (!total) return "Nenhum gato cadastrado até o momento.";
    return `${total} gato${total > 1 ? "s" : ""} cadastrados no FastAPI.`;
  }, [gatos]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Gatos</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre peludos resgatados, acompanhe condições de saúde e mantenha o status de adoção atualizado.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-2xl shadow-primary/10 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Histórico recente</h2>
          </div>
          <Button onClick={openCreate}>Novo gato</Button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        ) : gatos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum gato cadastrado. Clique em &quot;Novo gato&quot; para começar.
          </p>
        ) : (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Raça</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gatos.map((gato) => (
                <TableRow key={gato.id}>
                  <TableCell>#{gato.id}</TableCell>
                  <TableCell className="font-medium">{gato.nome}</TableCell>
                  <TableCell>{gato.idade ?? "—"}</TableCell>
                  <TableCell>{gato.cor ?? "—"}</TableCell>
                  <TableCell>{gato.raca ?? "—"}</TableCell>
                  <TableCell>{gato.condicao_saude ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-2">
                      <button
                        className="inline-flex h-9 min-w-[104px] items-center justify-center rounded-full border border-border bg-white/80 px-3 text-xs font-semibold text-foreground transition hover:bg-muted"
                        onClick={() => openEdit(gato)}
                      >
                        Editar
                      </button>
                      <button
                        className="inline-flex h-9 min-w-[104px] items-center justify-center rounded-full border border-border bg-white/80 px-3 text-xs font-semibold text-[#1d1d1f] transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => handleDelete(gato.id)}
                        disabled={deletingId === gato.id}
                      >
                        {deletingId === gato.id ? "Removendo..." : "Excluir"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <GatoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title={editing ? "Editar gato" : "Novo gato"}
          form={form}
          enderecos={enderecos}
          loading={saving}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}

function mapFormToPayload(form: GatoFormValues) {
  return {
    nome: form.nome,
    idade: form.idade ? Number(form.idade) : null,
    data_resgate: form.data_resgate || null,
    endereco_resgate_id: form.endereco_resgate_id
      ? Number(form.endereco_resgate_id)
      : null,
    cor: form.cor || null,
    raca: form.raca || null,
    condicao_saude: form.condicao_saude || null,
  };
}
