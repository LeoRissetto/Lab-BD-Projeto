"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/lib/api";

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

  const executeQuery = useCallback(async (slug: string) => {
    setExecuting(true);
    setError(null);
    try {
      const { data } = await api.get<QueryDetail>(`/queries/${slug}`);
      setSelected(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao executar consulta"));
    } finally {
      setExecuting(false);
    }
  }, []);

  const loadQueries = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const { data } = await api.get<QuerySummary[]>("/queries");
      setQueries(data);
      if (data.length > 0) {
        executeQuery(data[0].slug);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao listar consultas"));
    } finally {
      setLoadingList(false);
    }
  }, [executeQuery]);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  const columns = useMemo(() => {
    if (!selected?.rows?.length) return [];
    return Object.keys(selected.rows[0]);
  }, [selected]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Relatórios SQL</h1>
        <p className="text-sm text-muted-foreground">
          Lista dinâmica vinda de <code className="text-xs">/queries</code> e execução no FastAPI.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <aside className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Consultas disponíveis</h2>
          {loadingList ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : queries.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma consulta cadastrada no backend.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {queries.map((query) => {
                const active = selected?.slug === query.slug;
                return (
                  <li key={query.slug}>
                    <button
                      onClick={() => executeQuery(query.slug)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/40"
                      }`}
                      disabled={executing && active}
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {query.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {query.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {query.topics.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="rounded-2xl border border-border bg-card p-5">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {selected.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeQuery(selected.slug)}
                  disabled={executing}
                >
                  {executing ? "Executando..." : "Executar novamente"}
                </Button>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  SQL
                </p>
                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-card/80 p-3 text-xs text-muted-foreground">
                  {selected.sql.trim()}
                </pre>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Resultado ({selected.rows.length} linha(s))
                </h3>

                {executing ? (
                  <p className="mt-2 text-sm text-muted-foreground">Executando...</p>
                ) : selected.rows.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhum dado retornado.
                  </p>
                ) : (
                  <div className="mt-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((column) => (
                            <TableHead key={column}>{column}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.rows.map((row, index) => (
                          <TableRow key={index}>
                            {columns.map((column) => (
                              <TableCell key={column}>
                                {formatValue(row[column])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecione uma consulta para visualizar o resultado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : value.toFixed(2);
  }
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("pt-BR").format(value);
  }
  return String(value);
}
