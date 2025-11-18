"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiUser, getApiErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<ApiUser>("/auth/login", {
        login,
        senha,
      });

      localStorage.setItem("lt_user", JSON.stringify(data));
      window.dispatchEvent(new Event("lt-user-changed"));
      router.push("/admin/dashboard");
    } catch (error) {
      setError(getApiErrorMessage(error, "Erro ao fazer login"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="w-full max-w-md rounded-xl bg-card shadow-lg p-8 border border-border">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          Projeto Lar Temporário
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Faça login para acessar o painel administrativo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Login (e-mail)
            </label>
            <input
              type="email"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Ainda não tem conta? {" "}
              <Link href="/admin/register" className="text-primary underline-offset-4 hover:underline">
                Crie uma agora
              </Link>
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}
