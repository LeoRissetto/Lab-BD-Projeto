"use client";

import { type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export type GatoFormValues = {
  nome: string;
  idade: string;
  data_resgate: string;
  endereco_resgate_id: string;
  cor: string;
  raca: string;
  condicao_saude: string;
};

export type EnderecoOption = {
  id: number;
  descricao: string;
};

type Props = {
  open: boolean;
  title: string;
  loading: boolean;
  form: GatoFormValues;
  enderecos: EnderecoOption[];
  onOpenChange: (open: boolean) => void;
  onChange: (field: keyof GatoFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function GatoModal({
  open,
  title,
  loading,
  form,
  enderecos,
  onOpenChange,
  onChange,
  onSubmit,
}: Props) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Informe os dados básicos do gato resgatado."
    >
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-muted-foreground">
            Nome
            <Input
              value={form.nome}
              onChange={(e) => onChange("nome", e.target.value)}
              required
            />
          </label>
          <label className="text-sm font-medium text-muted-foreground">
            Idade (anos)
            <Input
              type="number"
              value={form.idade}
              onChange={(e) => onChange("idade", e.target.value)}
              min="0"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-muted-foreground">
            Data do resgate
            <Input
              type="date"
              value={form.data_resgate}
              onChange={(e) => onChange("data_resgate", e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-muted-foreground">
            Endereço
            <select
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={form.endereco_resgate_id}
              onChange={(e) => onChange("endereco_resgate_id", e.target.value)}
            >
              <option value="">Selecione</option>
              {enderecos.map((e) => (
                <option key={e.id} value={e.id}>
                  #{e.id} — {e.descricao}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-muted-foreground">
            Cor
            <Input
              value={form.cor}
              onChange={(e) => onChange("cor", e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-muted-foreground">
            Raça
            <Input
              value={form.raca}
              onChange={(e) => onChange("raca", e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-muted-foreground">
            Condição de saúde
            <Input
              value={form.condicao_saude}
              onChange={(e) => onChange("condicao_saude", e.target.value)}
            />
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Modal>
  );
}
