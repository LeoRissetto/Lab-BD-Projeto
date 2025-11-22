// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";

// import { Button } from "@/components/ui/button";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { api, getApiErrorMessage } from "@/lib/api";

// type QuerySummary = {
//   slug: string;
//   title: string;
//   description: string;
//   topics: string[];
// };

// type QueryDetail = QuerySummary & {
//   sql: string;
//   rows: Record<string, unknown>[];
// };

// export default function AdminConsultasPage() {
//   const [queries, setQueries] = useState<QuerySummary[]>([]);
//   const [selected, setSelected] = useState<QueryDetail | null>(null);
//   const [loadingList, setLoadingList] = useState(true);
//   const [executing, setExecuting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const executeQuery = useCallback(async (slug: string) => {
//     setExecuting(true);
//     setError(null);
//     try {
//       const { data } = await api.get<QueryDetail>(`/queries/${slug}`);
//       setSelected(data);
//     } catch (err) {
//       setError(getApiErrorMessage(err, "Erro ao executar consulta"));
//     } finally {
//       setExecuting(false);
//     }
//   }, []);

//   const loadQueries = useCallback(async () => {
//     setLoadingList(true);
//     setError(null);
//     try {
//       const { data } = await api.get<QuerySummary[]>("/queries");
//       setQueries(data);
//       if (data.length > 0) {
//         executeQuery(data[0].slug);
//       }
//     } catch (err) {
//       setError(getApiErrorMessage(err, "Erro ao listar consultas"));
//     } finally {
//       setLoadingList(false);
//     }
//   }, [executeQuery]);

//   useEffect(() => {
//     loadQueries();
//   }, [loadQueries]);

//   const columns = useMemo(() => {
//     if (!selected?.rows?.length) return [];
//     return Object.keys(selected.rows[0]);
//   }, [selected]);

//   return (
//     <div className="space-y-6">
//       <header>
//         <h1 className="text-2xl font-semibold text-foreground">Relatórios SQL</h1>
//         <p className="text-sm text-muted-foreground">
//           Lista dinâmica vinda de <code className="text-xs">/queries</code> e execução no FastAPI.
//         </p>
//       </header>

//       {error ? (
//         <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
//           {error}
//         </p>
//       ) : null}

//       <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
//         <aside className="rounded-2xl border border-border bg-card p-5">
//           <h2 className="text-lg font-semibold">Consultas disponíveis</h2>
//           {loadingList ? (
//             <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
//           ) : queries.length === 0 ? (
//             <p className="mt-4 text-sm text-muted-foreground">
//               Nenhuma consulta cadastrada no backend.
//             </p>
//           ) : (
//             <ul className="mt-4 space-y-3">
//               {queries.map((query) => {
//                 const active = selected?.slug === query.slug;
//                 return (
//                   <li key={query.slug}>
//                     <button
//                       onClick={() => executeQuery(query.slug)}
//                       className={`w-full rounded-xl border px-4 py-3 text-left transition ${
//                         active
//                           ? "border-primary bg-primary/10"
//                           : "border-border hover:bg-muted/40"
//                       }`}
//                       disabled={executing && active}
//                     >
//                       <p className="text-sm font-semibold text-foreground">
//                         {query.title}
//                       </p>
//                       <p className="text-xs text-muted-foreground line-clamp-2">
//                         {query.description}
//                       </p>
//                       <div className="mt-2 flex flex-wrap gap-1.5">
//                         {query.topics.map((topic) => (
//                           <span
//                             key={topic}
//                             className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
//                           >
//                             {topic}
//                           </span>
//                         ))}
//                       </div>
//                     </button>
//                   </li>
//                 );
//               })}
//             </ul>
//           )}
//         </aside>

//         <div className="rounded-2xl border border-border bg-card p-5">
//           {selected ? (
//             <>
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <h2 className="text-xl font-semibold text-foreground">
//                     {selected.title}
//                   </h2>
//                   <p className="text-sm text-muted-foreground">
//                     {selected.description}
//                   </p>
//                 </div>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => executeQuery(selected.slug)}
//                   disabled={executing}
//                 >
//                   {executing ? "Executando..." : "Executar novamente"}
//                 </Button>
//               </div>

//               <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4">
//                 <p className="text-xs font-semibold text-muted-foreground uppercase">
//                   SQL
//                 </p>
//                 <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-card/80 p-3 text-xs text-muted-foreground">
//                   {selected.sql.trim()}
//                 </pre>
//               </div>

//               <div className="mt-6">
//                 <h3 className="text-sm font-semibold text-muted-foreground uppercase">
//                   Resultado ({selected.rows.length} linha(s))
//                 </h3>

//                 {executing ? (
//                   <p className="mt-2 text-sm text-muted-foreground">Executando...</p>
//                 ) : selected.rows.length === 0 ? (
//                   <p className="mt-2 text-sm text-muted-foreground">
//                     Nenhum dado retornado.
//                   </p>
//                 ) : (
//                   <div className="mt-3">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           {columns.map((column) => (
//                             <TableHead key={column}>{column}</TableHead>
//                           ))}
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {selected.rows.map((row, index) => (
//                           <TableRow key={index}>
//                             {columns.map((column) => (
//                               <TableCell key={column}>
//                                 {formatValue(row[column])}
//                               </TableCell>
//                             ))}
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 )}
//               </div>
//             </>
//           ) : (
//             <p className="text-sm text-muted-foreground">
//               Selecione uma consulta para visualizar o resultado.
//             </p>
//           )}
//         </div>
//       </section>
//     </div>
//   );
// }

// function formatValue(value: unknown) {
//   if (value === null || value === undefined) return "—";
//   if (typeof value === "number") {
//     return Number.isInteger(value) ? value : value.toFixed(2);
//   }
//   if (value instanceof Date) {
//     return new Intl.DateTimeFormat("pt-BR").format(value);
//   }
//   return String(value);
// }

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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

export default function AdminConsultasPage() {
  const [queries, setQueries] = useState<QuerySummary[]>([]);
  const [selected, setSelected] = useState<QueryDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar lista de relatórios
  const fetchQueries = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const { data } = await api.get<QuerySummary[]>("/queries");
      setQueries(data);
      // se não tiver nenhum selecionado ainda, busca o primeiro
      if (data.length > 0 && !selected) {
        await executeQuery(data[0].slug);
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingList(false);
    }
  }, [selected]);

  // Executar um relatório específico
  const executeQuery = useCallback(async (slug: string) => {
    setExecuting(true);
    setError(null);
    try {
      const { data } = await api.get<QueryDetail>(`/queries/${slug}`);
      setSelected(data);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setExecuting(false);
    }
  }, []);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  // Colunas da tabela de resultado
  const columns = useMemo(() => {
    if (!selected?.rows?.length) return [];
    return Object.keys(selected.rows[0]);
  }, [selected]);

  // Dados tratados para gráficos, de acordo com o slug
  const chartData = useMemo(() => {
    if (!selected?.rows?.length) return null;
    const rows = selected.rows as any[];

    switch (selected.slug) {
      case "doacoes_rollup":
        // vamos mostrar um gráfico simples: total_doado por mês (somando campanhas)
        const porMes: Record<string, number> = {};
        for (const r of rows) {
          if (r.mes === "TOTAL") continue;
          const mes = r.mes as string;
          const total = Number(r.total_doado ?? 0);
          porMes[mes] = (porMes[mes] || 0) + total;
        }
        return Object.entries(porMes).map(([mes, total]) => ({
          mes,
          total,
        }));

      case "ranking_doadores_window":
        return rows
          .slice(0, 5) // Pega só os 5 primeiros
          .map((r) => ({
            nome: (r.nome as string) || (r.cpf as string),
            total_doado: Number(r.total_doado ?? 0),
            posicao: Number(r.posicao ?? 0),
            percentual: Number(r.percentual ?? 0),
          }));


      case "gastos_grouping_sets":
        // nivel, lar_id, cidade, tipo, gasto_total
        // Para o gráfico, vamos mostrar TOTAL_POR_TIPO: tipo x gasto_total
        return rows
          .filter((r) => r.nivel === "TOTAL_POR_TIPO")
          .map((r) => ({
            tipo: (r.tipo as string) ?? "OUTROS",
            gasto_total: Number(r.gasto_total ?? 0),
          }));


      case "gasto_total_funcao":
        // gato_id, nome, gasto_total
        return rows.map((r) => ({
          gato: (r.nome as string) || `Gato ${r.gato_id}`,
          gasto_total: Number(r.gasto_total ?? 0),
        }));

      case "gastos_cursor":
      // gato_nome, gato_id, total_gasto
        return rows.map((r) => ({
          gato: (r.gato_nome as string) || `Gato ${r.gato_id}`,
          total_gasto: Number(r.total_gasto ?? 0),
      }));


      case "ocupacao_lares":
        // lar_id, cidade, estado, capacidade_maxima, gatos_hospedados, vagas_disponiveis
        return rows.map((r) => ({
          lar: String(r.lar_id),
          gatos_hospedados: Number(r.gatos_hospedados ?? 0),
          vagas_disponiveis: Number(r.vagas_disponiveis ?? 0),
          capacidade_maxima: Number(r.capacidade_maxima ?? 0),
        }));

      default:
        return null;
    }
  }, [selected]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Relatórios e Consultas
          </h1>
          <p className="text-sm text-muted-foreground">
            Relatórios avançados (ROLLUP, Window Functions, funções PL/pgSQL,
            cursores) com visualização em tabela e gráficos.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchQueries}>
          Recarregar lista
        </Button>
      </header>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        {/* LISTA DE RELATÓRIOS */}
        <aside className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Consultas disponíveis</h2>

          {loadingList ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Carregando lista de relatórios...
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {queries.map((q) => (
                <li key={q.slug}>
                  <button
                    type="button"
                    onClick={() => executeQuery(q.slug)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selected?.slug === q.slug
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{q.title}</div>
                    <p className="text-xs text-muted-foreground">
                      {q.description}
                    </p>
                    <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                      {q.topics.join(" • ")}
                    </p>
                  </button>
                </li>
              ))}

              {queries.length === 0 && !loadingList && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhum relatório cadastrado em <code>/queries</code>.
                </p>
              )}
            </ul>
          )}
        </aside>

        {/* DETALHE DO RELATÓRIO SELECIONADO */}
        <main className="rounded-2xl border border-border bg-card p-5">
          {executing && !selected && (
            <p className="text-sm text-muted-foreground">
              Carregando relatório...
            </p>
          )}

          {selected && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{selected.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {selected.description}
                </p>
              </div>

              {/* GRÁFICO */}
              {chartData && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Visualização gráfica
                  </h3>

                  <div className="h-72 w-full rounded-xl border border-border bg-background p-3">
                    {/* doacoes_rollup → linha mes x total */}
                    {selected.slug === "doacoes_rollup" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="total"
                            name="Total doado"
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}

                    {/* ranking_doadores_window → barra horizontal por doador */}
                    {selected.slug === "ranking_doadores_window" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis
                            type="category"
                            dataKey="nome"
                            width={150}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="total_doado"
                            name="Total doado"
                            fill="var(--chart-2)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {/* gastos_grouping_sets → barras tipo x gasto_total */}
                    {selected.slug === "gastos_grouping_sets" && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tipo" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="gasto_total"
                          name="Gasto total por tipo"
                          fill="var(--chart-3)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}


                    {/* gasto_total_funcao → barras gato x gasto_total */}
                    {selected.slug === "gasto_total_funcao" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="gato" />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="gasto_total"
                            name="Gasto total"
                            fill="var(--chart-4)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {/* gastos_cursor → barras gato x total_gasto */}
                    {selected.slug === "gastos_cursor" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="gato" />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="total_gasto"
                            name="Gasto total"
                            fill="var(--chart-3)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}


                    {/* ocupacao_lares → barras gatos_hospedados / vagas_disponiveis */}
                    {selected.slug === "ocupacao_lares" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="lar" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="gatos_hospedados"
                            name="Gatos hospedados"
                            fill="var(--chart-1)"
                          />
                          <Bar
                            dataKey="vagas_disponiveis"
                            name="Vagas disponíveis"
                            fill="var(--chart-4)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {/* TABELA DE RESULTADO */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Resultado ({selected.rows.length} linha(s))
                </h3>

                {selected.rows.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhum registro encontrado para esta consulta.
                  </p>
                ) : (
                  <div className="mt-2 max-h-80 overflow-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((col) => (
                            <TableHead key={col} className="whitespace-nowrap">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.rows.map((row, idx) => (
                          <TableRow key={idx}>
                            {columns.map((col) => (
                              <TableCell key={col}>
                                {formatValue((row as any)[col])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          {!selected && !executing && (
            <p className="text-sm text-muted-foreground">
              Selecione um relatório na coluna ao lado para visualizar os
              detalhes.
            </p>
          )}
        </main>
      </section>
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : Number(value).toFixed(2);
  }
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("pt-BR").format(value);
  }
  return String(value);
}
