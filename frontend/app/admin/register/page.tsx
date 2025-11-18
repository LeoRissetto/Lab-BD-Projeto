"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api, ApiUser, getApiErrorMessage } from "@/lib/api";

const tipos = [
  { value: "VOLUNTARIO", label: "Voluntário" },
  { value: "VETERINARIO", label: "Veterinário" },
  { value: "ADMIN", label: "Admin" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("VOLUNTARIO");
  const [idoriginal, setIdoriginal] = useState("");
  const [crmv, setCrmv] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [clinica, setClinica] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        login,
        senha,
        tipo,
        nome,
        idoriginal: idoriginal || null,
        crmv: crmv || null,
        especialidade: especialidade || null,
        clinica: clinica || null,
      };
      const { data } = await api.post<ApiUser>("/auth/register", payload);

      localStorage.setItem("lt_user", JSON.stringify(data));
      window.dispatchEvent(new Event("lt-user-changed"));
      router.push("/admin/dashboard");
    } catch (error) {
      setError(getApiErrorMessage(error, "Erro ao criar usuário"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="w-full max-w-lg rounded-xl bg-card shadow-lg p-8 border border-border">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          Criar conta
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Cadastre um novo usuário para acessar o painel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Login (e-mail)</label>
              <input
                type="email"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {tipos.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">CPF {tipo !== "ADMIN" ? "(obrigatório)" : "(opcional)"}</label>
              <input
                type="text"
                value={idoriginal}
                onChange={(e) => setIdoriginal(e.target.value)}
                placeholder="Somente números"
                maxLength={11}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required={tipo !== "ADMIN"}
              />
            </div>

            {tipo === "VETERINARIO" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">CRMV</label>
                  <input
                    type="text"
                    value={crmv}
                    onChange={(e) => setCrmv(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required={tipo === "VETERINARIO"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Especialidade (opcional)</label>
                  <input
                    type="text"
                    value={especialidade}
                    onChange={(e) => setEspecialidade(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Clínica (opcional)</label>
                  <input
                    type="text"
                    value={clinica}
                    onChange={(e) => setClinica(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Já tem uma conta? {" "}
            <Link href="/admin/login" className="text-primary underline-offset-4 hover:underline">
              Fazer login
            </Link>
          </p>
        </form>

        <p className="mt-3 text-[11px] text-center text-muted-foreground">
          CPF obrigatório para Voluntário/Veterinário. Para veterinário, informe também o CRMV.
        </p>
      </div>
    </div>
  );
}
