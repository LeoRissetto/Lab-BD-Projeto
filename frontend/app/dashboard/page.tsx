import { redirect } from "next/navigation";

import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBackendBaseUrl } from "@/lib/backend";

type QuerySummary = {
  slug: string;
  title: string;
  description: string;
  topics: string[];
};

type QueryDetail = QuerySummary & {
  sql: string;
  rows: Record<string, unknown>[];
};

type QueryMap = Record<string, QueryDetail>;

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
});

async function fetchQueries(): Promise<QueryDetail[]> {
  const baseUrl = getBackendBaseUrl();

  const summariesResponse = await fetch(`${baseUrl}/queries`, {
    cache: "no-store",
  });

  if (!summariesResponse.ok) {
    throw new Error(
      `Não foi possível obter a lista de consultas (status: ${summariesResponse.status}).`,
    );
  }

  const summaries = (await summariesResponse.json()) as QuerySummary[];

  const details = await Promise.all(
    summaries.map(async (summary) => {
      const detailResponse = await fetch(`${baseUrl}/queries/${summary.slug}`, {
        cache: "no-store",
      });

      if (!detailResponse.ok) {
        throw new Error(
          `Falha ao carregar a consulta "${summary.title}" (status: ${detailResponse.status}).`,
        );
      }

      const detail = (await detailResponse.json()) as QueryDetail;
      return detail;
    }),
  );

  return details;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let queries: QueryDetail[] = [];
  let backendError: string | null = null;

  try {
    queries = await fetchQueries();
  } catch (error) {
    backendError =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao consultar o backend.";
  }

  const queryMap: QueryMap = Object.fromEntries(
    queries.map((query) => [query.slug, query]),
  );

  const gatosDisponiveis = queryMap["gatos_disponiveis"]?.rows ?? [];
  const adocoesDetalhadas = queryMap["adocoes_detalhadas"]?.rows ?? [];
  const doacoesRollup = queryMap["doacoes_rollup"]?.rows ?? [];
  const gastosCube = queryMap["gastos_cube"]?.rows ?? [];
  const rankingGatos = queryMap["ranking_gatos"]?.rows ?? [];
  const mediaMovelDoacoes = queryMap["media_movel_doacoes"]?.rows ?? [];
  const laresOcupacaoRows = queryMap["lar_ocupacao"]?.rows ?? [];
  const voluntariosFuncoes = queryMap["voluntarios_funcoes"]?.rows ?? [];
  const eventosAgenda = queryMap["eventos_agenda"]?.rows ?? [];
  const procedimentosVeterinarios =
    queryMap["procedimentos_veterinarios"]?.rows ?? [];
  const triagensPendentesRows = queryMap["triagens_pendentes"]?.rows ?? [];
  const triggers = queryMap["lista_triggers"]?.rows ?? [];
  const views = queryMap["visoes_e_materializacoes"]?.rows ?? [];
  const conexoes = queryMap["conexoes_ativas"]?.rows ?? [];

  const totalGatosDisponiveis = gatosDisponiveis.length;

  const adocoesUltimos30Dias = adocoesDetalhadas.filter((adocao) => {
    const data = toDate(adocao.data);
    if (!data) {
      return false;
    }

    const diffInDays = (Date.now() - data.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 30;
  });

  const adocoesRecentes = [...adocoesDetalhadas]
    .map((adocao) => ({
      ...adocao,
      dataFormatada: toDate(adocao.data),
    }))
    .filter((adocao) => adocao.dataFormatada)
    .slice(0, 5);

  const doacoesPorMes = doacoesRollup.filter(
    (row) =>
      typeof row.mes === "string" &&
      row.mes !== "TOTAL" &&
      row.campanha === "TODAS AS CAMPANHAS",
  );

  const doacoesOrdenadas = [...doacoesPorMes].sort((a, b) => {
    const dataA = toDate(a.mes);
    const dataB = toDate(b.mes);
    if (!dataA || !dataB) {
      return 0;
    }

    return dataA.getTime() - dataB.getTime();
  });

  const doacoesUltimosSeisMeses = doacoesOrdenadas.slice(-6);

  const totalDoacoesUltimoMes = (() => {
    const ultimo = doacoesUltimosSeisMeses.at(-1);
    return ultimo ? (toNumber(ultimo.total_doado) ?? 0) : 0;
  })();

  const totalGastosRegistrados =
    toNumber(
      gastosCube.find(
        (row) =>
          row.estado === "TODOS OS ESTADOS" && row.tipo === "TODOS OS TIPOS",
      )?.total_gasto,
    ) ?? 0;

  const gastosPorEstado = gastosCube
    .filter(
      (row) =>
        typeof row.estado === "string" &&
        row.estado !== "TODOS OS ESTADOS" &&
        row.tipo === "TODOS OS TIPOS",
    )
    .map((row) => ({
      estado: row.estado as string,
      total: toNumber(row.total_gasto) ?? 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const gatosPrioritarios = rankingGatos.slice(0, 5).map((row) => ({
    id: row.id,
    nome: row.nome,
    idade: toNumber(row.idade),
    ranking: toNumber(row.ranking_por_idade),
    prioridade: toNumber(row.prioridade_resgate),
  }));

  const mediaMovelUltimosMeses = mediaMovelDoacoes
    .map((row) => ({
      mes: row.mes,
      media: toNumber(row.media_movel_3m) ?? 0,
      total: toNumber(row.total_mes) ?? 0,
    }))
    .filter((row) => typeof row.mes === "string" && row.mes !== "TOTAL")
    .slice(-6);

  const laresOcupacao = laresOcupacaoRows.map((row) => ({
    id: row.lar_id,
    cidade: row.cidade ?? "Não informado",
    estado: row.estado ?? "—",
    capacidade: toNumber(row.capacidade_maxima),
    hospedados: toNumber(row.gatos_hospedados) ?? 0,
    vagas: toNumber(row.vagas_disponiveis) ?? 0,
    taxa: toNumber(row.taxa_ocupacao),
  }));

  const laresAtivos = laresOcupacao.length;
  const totalVagasDisponiveis = laresOcupacao.reduce(
    (acc, lar) => acc + (lar.vagas ?? 0),
    0,
  );

  const laresDestaque = [...laresOcupacao]
    .sort(
      (a, b) =>
        (b.taxa ?? 0) - (a.taxa ?? 0) ||
        (b.hospedados ?? 0) - (a.hospedados ?? 0),
    )
    .slice(0, 6);

  const voluntariadoLista = voluntariosFuncoes
    .map((row) => ({
      funcao: row.funcao as string,
      total: toNumber(row.voluntarios) ?? 0,
    }))
    .filter((row) => row.funcao)
    .sort((a, b) => b.total - a.total)
    .filter((row) => row.total > 0);

  const voluntariadoResumo = voluntariadoLista.slice(0, 8);

  const totalVoluntarios = voluntariadoLista.reduce(
    (acc, item) => acc + item.total,
    0,
  );

  const eventosFuturos = eventosAgenda
    .map((row) => ({
      id: row.id,
      nome: row.nome as string,
      dataInicio: toDate(row.data_inicio),
      dataFim: toDate(row.data_fim),
      cidade: row.cidade ?? "—",
      estado: row.estado ?? "—",
    }))
    .filter((evento) => evento.nome)
    .slice(0, 8);

  const triagensPendentes = triagensPendentesRows
    .map((row) => ({
      adotanteCpf: row.adotante_cpf as string,
      adotante: row.adotante as string,
      data: toDate(row.data),
      resultado: row.resultado as string | null,
      responsavel: row.responsavel as string | null,
    }))
    .slice(0, 8);

  const procedimentosResumo = procedimentosVeterinarios
    .map((row) => ({
      tipo: row.tipo as string,
      total: toNumber(row.total_procedimentos) ?? 0,
      custo: toNumber(row.custo_total) ?? 0,
    }))
    .filter((row) => row.tipo);

  const totalProcedimentos90Dias = procedimentosResumo.reduce(
    (acc, item) => acc + item.total,
    0,
  );
  const custoProcedimentos90Dias = procedimentosResumo.reduce(
    (acc, item) => acc + item.custo,
    0,
  );

  const contadorTriggers = triggers.length;
  const contadorViews = views.length;
  const conexoesAtivas = conexoes.length;

  const stats = [
    {
      label: "Gatos disponíveis",
      value: numberFormatter.format(totalGatosDisponiveis),
      helper: "Aguardando lar definitivo.",
    },
    {
      label: "Adoções nos últimos 30 dias",
      value: numberFormatter.format(adocoesUltimos30Dias.length),
      helper: "Indicador de sucesso recente.",
    },
    {
      label: "Doações do último mês",
      value: currencyFormatter.format(totalDoacoesUltimoMes),
      helper: "Soma considerando todas as campanhas.",
    },
    {
      label: "Gastos catalogados",
      value: currencyFormatter.format(totalGastosRegistrados),
      helper: "Totais financeiros registrados no sistema.",
    },
    {
      label: "Lares ativos",
      value: numberFormatter.format(laresAtivos),
      helper: "Lares temporários cadastrados.",
    },
    {
      label: "Vagas disponíveis",
      value: numberFormatter.format(totalVagasDisponiveis),
      helper: "Vagas livres nos lares.",
    },
    {
      label: "Eventos futuros",
      value: numberFormatter.format(eventosFuturos.length),
      helper: "Agenda para reforçar a adoção.",
    },
    {
      label: "Triagens pendentes",
      value: numberFormatter.format(triagensPendentes.length),
      helper: "Avaliações aguardando decisão.",
    },
    {
      label: "Procedimentos (90 dias)",
      value: numberFormatter.format(totalProcedimentos90Dias),
      helper: "Total de procedimentos registrados.",
    },
    {
      label: "Custo veterinário (90 dias)",
      value: currencyFormatter.format(custoProcedimentos90Dias),
      helper: "Investimento recente em saúde.",
    },
  ];

  return (
    <main className="min-h-screen bg-background px-5 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-8 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Projeto Lar Temporário
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              Painel de Operações SQL
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              Explore consultas reais construídas para o banco de dados do
              projeto. Cada item cobre tópicos da disciplina: DDL, DML, junções,
              agregações avançadas, triggers, visões, PL/pgSQL, índices e
              monitoramento.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Sessão ativa:{" "}
              <span className="font-medium text-foreground">{user.email}</span>
            </div>
            <form action={logout}>
              <Button type="submit" variant="destructive">
                Encerrar sessão
              </Button>
            </form>
          </div>
        </header>

        {backendError ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle>Não foi possível carregar as consultas</CardTitle>
              <CardDescription className="text-destructive">
                {backendError}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Verifique se o backend FastAPI está em execução e acessível no
                endereço configurado em BACKEND_URL.
              </p>
            </CardFooter>
          </Card>
        ) : null}

        {!backendError ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="border-border/70 bg-card/80">
                  <CardHeader className="pb-3">
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-3xl font-semibold text-foreground">
                      {stat.value}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      {stat.helper}
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Ocupação dos lares temporários</CardTitle>
                  <CardDescription>
                    Capacidade, hóspedes e vagas por lar ativo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {laresDestaque.length ? (
                    <div className="overflow-x-auto rounded-lg border border-border/60">
                      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                        <thead className="bg-muted/60 text-foreground/80">
                          <tr>
                            <th className="px-4 py-2 font-medium">Lar</th>
                            <th className="px-4 py-2 font-medium">
                              Capacidade
                            </th>
                            <th className="px-4 py-2 font-medium">Hóspedes</th>
                            <th className="px-4 py-2 font-medium">Vagas</th>
                            <th className="px-4 py-2 font-medium">Ocupação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {laresDestaque.map((lar) => (
                            <tr
                              key={lar.id}
                              className="border-t border-border/60 odd:bg-card/60 even:bg-card/80"
                            >
                              <td className="px-4 py-2">
                                <span className="font-medium text-foreground">
                                  Lar #{lar.id}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {lar.cidade} / {lar.estado}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                {lar.capacidade !== null
                                  ? numberFormatter.format(lar.capacidade)
                                  : "—"}
                              </td>
                              <td className="px-4 py-2">
                                {numberFormatter.format(lar.hospedados ?? 0)}
                              </td>
                              <td className="px-4 py-2">
                                {numberFormatter.format(lar.vagas ?? 0)}
                              </td>
                              <td className="px-4 py-2">
                                {lar.taxa !== null ? `${lar.taxa}%` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum dado de ocupação disponível.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Força voluntária</CardTitle>
                  <CardDescription>
                    Funções com maior participação de voluntários.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Total de voluntários mapeados
                    </p>
                    <p className="text-2xl font-semibold text-foreground">
                      {numberFormatter.format(totalVoluntarios)}
                    </p>
                  </div>
                  {voluntariadoResumo.length ? (
                    <ul className="space-y-3">
                      {voluntariadoResumo.map((item) => (
                        <li
                          key={item.funcao}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 p-4"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {item.funcao}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {numberFormatter.format(item.total)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma função cadastrada para voluntários.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Prioridade de adoção</CardTitle>
                  <CardDescription>
                    Gatos classificados por idade e prioridade de resgate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gatosPrioritarios.length ? (
                    <ul className="space-y-3">
                      {gatosPrioritarios.map((gato, index) => (
                        <li
                          key={`${gato.id}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 p-4"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {gato.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {gato.idade !== null
                                ? `${gato.idade} ano(s)`
                                : "Idade não informada"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase text-muted-foreground">
                              Ranking
                            </p>
                            <p className="text-xl font-semibold text-foreground">
                              {gato.ranking ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Prioridade #{gato.prioridade ?? "—"}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum dado disponível para o ranking de gatos.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Adoções recentes</CardTitle>
                  <CardDescription>
                    Registros mais recentes com adotante e data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adocoesRecentes.length ? (
                    <ul className="space-y-3">
                      {adocoesRecentes.map((adocao, index) => (
                        <li
                          key={`${adocao.gato}-${index}`}
                          className="rounded-lg border border-border/60 bg-muted/40 p-4"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {adocao.gato} → {adocao.adotante}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {adocao.dataFormatada
                              ? dateFormatter.format(adocao.dataFormatada)
                              : "Data não informada"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {adocao.cidade_adotante && adocao.estado_adotante
                              ? `${adocao.cidade_adotante} / ${adocao.estado_adotante}`
                              : "Local não informado"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma adoção registrada.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Arrecadação mensal</CardTitle>
                  <CardDescription>
                    Visão consolidada das doações por mês.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {doacoesUltimosSeisMeses.length ? (
                    <div className="overflow-x-auto rounded-lg border border-border/60">
                      <table className="w-full min-w-[24rem] border-collapse text-left text-sm">
                        <thead className="bg-muted/60 text-foreground/80">
                          <tr>
                            <th className="px-4 py-2 font-medium">Mês</th>
                            <th className="px-4 py-2 font-medium">Total</th>
                            <th className="px-4 py-2 font-medium">
                              Média móvel (3m)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {doacoesUltimosSeisMeses.map((row, index) => {
                            const dataMes = toDate(row.mes);
                            return (
                              <tr
                                key={`${row.mes}-${index}`}
                                className="border-t border-border/60 odd:bg-card/60 even:bg-card/80"
                              >
                                <td className="px-4 py-2">
                                  {dataMes
                                    ? dateFormatter.format(dataMes)
                                    : row.mes}
                                </td>
                                <td className="px-4 py-2">
                                  {currencyFormatter.format(row.total)}
                                </td>
                                <td className="px-4 py-2">
                                  {currencyFormatter.format(row.media)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum dado de doações encontrado.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Gastos por estado</CardTitle>
                  <CardDescription>
                    Estados com maior investimento registrado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gastosPorEstado.length ? (
                    <ul className="space-y-3">
                      {gastosPorEstado.map((estado, index) => (
                        <li
                          key={`${estado.estado}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 p-4"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {estado.estado}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {currencyFormatter.format(estado.total)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum gasto registrado por estado.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Agenda de eventos</CardTitle>
                  <CardDescription>
                    Próximas ações planejadas para divulgação e arrecadação.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {eventosFuturos.length ? (
                    <ul className="space-y-3">
                      {eventosFuturos.map((evento) => (
                        <li
                          key={evento.id}
                          className="rounded-lg border border-border/60 bg-muted/40 p-4"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {evento.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {evento.dataInicio
                              ? `Início: ${dateFormatter.format(evento.dataInicio)}`
                              : "Data inicial não definida"}
                            {evento.dataFim
                              ? ` • Fim: ${dateFormatter.format(evento.dataFim)}`
                              : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Local: {evento.cidade} / {evento.estado}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum evento futuro cadastrado.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Triagens pendentes</CardTitle>
                  <CardDescription>
                    Acompanhamento das avaliações sem resultado definitivo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {triagensPendentes.length ? (
                    <ul className="space-y-3">
                      {triagensPendentes.map((triagem) => (
                        <li
                          key={`${triagem.adotanteCpf}-${triagem.data?.toISOString() ?? "sem-data"}`}
                          className="rounded-lg border border-border/60 bg-muted/40 p-4"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {triagem.adotante ?? triagem.adotanteCpf}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {triagem.data
                              ? dateFormatter.format(triagem.data)
                              : "Data não informada"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Status: {triagem.resultado ?? "Pendente"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Responsável: {triagem.responsavel ?? "—"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma triagem pendente no momento.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Procedimentos veterinários (90 dias)</CardTitle>
                <CardDescription>
                  Volume de atendimentos e custo agregado por tipo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {procedimentosResumo.length ? (
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full min-w-[24rem] border-collapse text-left text-sm">
                      <thead className="bg-muted/60 text-foreground/80">
                        <tr>
                          <th className="px-4 py-2 font-medium">
                            Tipo de procedimento
                          </th>
                          <th className="px-4 py-2 font-medium">Total</th>
                          <th className="px-4 py-2 font-medium">Custo total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {procedimentosResumo.map((proc) => (
                          <tr
                            key={proc.tipo}
                            className="border-t border-border/60 odd:bg-card/60 even:bg-card/80"
                          >
                            <td className="px-4 py-2">{proc.tipo}</td>
                            <td className="px-4 py-2">
                              {numberFormatter.format(proc.total)}
                            </td>
                            <td className="px-4 py-2">
                              {currencyFormatter.format(proc.custo)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum procedimento registrado nos últimos 90 dias.
                  </p>
                )}
              </CardContent>
            </Card>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Governança do banco</CardTitle>
                  <CardDescription>
                    Componentes auxiliares que suportam as operações.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Triggers
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {numberFormatter.format(contadorTriggers)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ações automáticas cadastradas.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Visões
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {numberFormatter.format(contadorViews)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Views e materializações disponíveis.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Sessões ativas
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {numberFormatter.format(conexoesAtivas)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Monitoramento de concorrência.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Checklist de disciplinas</CardTitle>
                  <CardDescription>
                    Conteúdos cobertos pelas consultas integradas.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <div className="grid gap-2 text-xs text-muted-foreground">
                    <p>
                      ✓ DDL e modelagem normalizada (endereços, pessoas, gatos)
                    </p>
                    <p>✓ DML com junções, filtros e ordenações</p>
                    <p>
                      ✓ Aggregations avançadas (ROLLUP, CUBE, window functions)
                    </p>
                    <p>✓ PL/pgSQL (funções, procedures) e triggers</p>
                    <p>✓ Visões, materializações e consulta ao catálogo</p>
                    <p>✓ Controle de concorrência, transações e segurança</p>
                  </div>
                </CardFooter>
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
