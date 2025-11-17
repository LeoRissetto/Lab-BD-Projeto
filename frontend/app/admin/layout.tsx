"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { ApiUser } from "@/lib/api";
import {
  Cat,
  Home,
  Users,
  Stethoscope,
  House,
  Wallet,
  HandCoins,
  CalendarDays,
  LineChart,
  LogOut,
} from "lucide-react";

type Props = {
  children: ReactNode;
};

const navItems = [
  { href: "/admin/dashboard", label: "Visão geral", icon: Home },
  { href: "/admin/gatos", label: "Gatos", icon: Cat },
  { href: "/admin/adocoes", label: "Adoções", icon: HandCoins },
  { href: "/admin/triagem", label: "Triagem", icon: LineChart },
  { href: "/admin/voluntarios", label: "Voluntários", icon: Users },
  { href: "/admin/veterinarios", label: "Veterinários", icon: Stethoscope },
  { href: "/admin/lares", label: "Lares", icon: House },
  { href: "/admin/gastos", label: "Gastos", icon: Wallet },
  { href: "/admin/doacoes", label: "Doações", icon: HandCoins },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/admin/consultas", label: "Relatórios", icon: LineChart },
];

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname === "/admin/login";
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const updateUser = () => setUser(readUserFromStorage());
    updateUser();

    function syncStorage(event: StorageEvent) {
      if (event.key === "lt_user") {
          updateUser();
      }
    }

    window.addEventListener("storage", syncStorage);
    const handleManualUpdate = () => {
      updateUser();
    };
    window.addEventListener("lt-user-changed", handleManualUpdate);

    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("lt-user-changed", handleManualUpdate);
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || isAuthRoute) {
      return;
    }
    if (!user) {
      router.replace("/admin/login");
    }
  }, [hydrated, isAuthRoute, router, user]);

  function handleLogout() {
    localStorage.removeItem("lt_user");
    setUser(null);
    router.push("/admin/login");
  }

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (!hydrated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-4 py-4 border-b border-sidebar-border">
          <h1 className="text-lg font-semibold">Lar Temporário</h1>
          <p className="text-xs text-muted-foreground">
            Painel administrativo
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3 flex items-center justify-between gap-2 text-xs">
          <div>
            <p className="font-medium truncate">
              {user ? user.login : "Carregando..."}
            </p>
            <p className="text-muted-foreground">
              {user?.tipo ?? "Usuário"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
          >
            <LogOut className="w-3 h-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}

function readUserFromStorage(): ApiUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("lt_user");
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}
