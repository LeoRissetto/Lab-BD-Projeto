"use client";

import { useEffect, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

type QueryResponse<T> = {
  rows: T[];
};

type GatoDisponivel = {
  id: number;
  nome: string;
};

type LarOcupacao = {
  lar_id: number;
  cidade: string | null;
  estado: string | null;
  capacidade_maxima: number | null;
  gatos_hospedados: number;
  vagas_disponiveis: number;
};

type RollupRow = {
  mes: string;
  campanha: string;
  total_doado: number;
};

type Evento = {
  id: number;
  nome: string;
  data_inicio: string | null;
  data_fim: string | null;
  cidade: string | null;
  estado: string | null;
};

type Voluntario = {
  cpf: string;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gatosDisponiveis, setGatosDisponiveis] = useState(0);
  const [totalDoacoes, setTotalDoacoes] = useState(0);
  const [voluntariosAtivos, setVoluntariosAtivos] = useState(0);
  const [lares, setLares] = useState<LarOcupacao[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [gatosRes, rollupRes, voluntariosRes, laresRes, eventosRes] =
          await Promise.all([
            api.get<QueryResponse<GatoDisponivel>>("/queries/gatos_disponiveis"),
            api.get<QueryResponse<RollupRow>>("/queries/doacoes_rollup"),
            api.get<Voluntario[]>("/voluntarios"),
            api.get<LarOcupacao[]>("/lares/ocupacao"),
            api.get<Evento[]>("/eventos/proximos"),
          ]);

        setGatosDisponiveis(gatosRes.data.rows.length);
        const totalRow = rollupRes.data.rows.find((row) => row.mes === "TOTAL");
        setTotalDoacoes(Number(totalRow?.total_doado ?? 0));
        setVoluntariosAtivos(voluntariosRes.data.length);
        setLares(laresRes.data);
        setEventos(eventosRes.data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Falha ao carregar painel"));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe os principais indicadores da operação do Lar Temporário.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Gatos disponíveis
              </p>
              <p className="mt-2 text-3xl font-semibold">{gatosDisponiveis}</p>
              <p className="text-xs text-muted-foreground">
                Consulta /queries/gatos_disponiveis
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total doado (ROLLUP)
              </p>
              <p className="mt-2 text-3xl font-semibold">
                R$ {totalDoacoes.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Endpoint /doacoes/rollup
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Voluntários ativos
              </p>
              <p className="mt-2 text-3xl font-semibold">{voluntariosAtivos}</p>
              <p className="text-xs text-muted-foreground">/voluntarios</p>
            </article>

            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Lares monitorados
              </p>
              <p className="mt-2 text-3xl font-semibold">{lares.length}</p>
              <p className="text-xs text-muted-foreground">/lares/ocupacao</p>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Ocupação de lares</h2>
                  <p className="text-sm text-muted-foreground">
                    Capacidade atual por lar temporário.
                  </p>
                </div>
              </div>

              {lares.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum lar cadastrado ainda.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lar</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Capacidade</TableHead>
                      <TableHead>Hospedados</TableHead>
                      <TableHead>Vagas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lares.map((lar) => (
                      <TableRow key={lar.lar_id}>
                        <TableCell>#{lar.lar_id}</TableCell>
                        <TableCell>
                          {[lar.cidade, lar.estado].filter(Boolean).join(" - ") || "—"}
                        </TableCell>
                        <TableCell>{lar.capacidade_maxima ?? "—"}</TableCell>
                        <TableCell>{lar.gatos_hospedados}</TableCell>
                        <TableCell>{lar.vagas_disponiveis}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Próximos eventos</h2>
                <p className="text-sm text-muted-foreground">
                  Cronograma vindo de /eventos/proximos.
                </p>
              </div>

              {eventos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento planejado.
                </p>
              ) : (
                <ul className="space-y-4">
                  {eventos.map((evento) => (
                    <li
                      key={evento.id}
                      className="rounded-xl border border-border/80 px-4 py-3"
                    >
                      <p className="font-medium text-foreground">{evento.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(evento.data_inicio)}{" "}
                        {evento.data_fim ? `até ${formatDate(evento.data_fim)}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[evento.cidade, evento.estado].filter(Boolean).join(" - ") || "Local não informado"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Data não definida";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
