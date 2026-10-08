"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { useAuth } from "@/lib/auth-context";
import {
  Users,
  LayoutDashboard,
  ShieldAlert,
  Clock,
  LogOut,
  Sparkles,
  Building2,
  FileCheck,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user || pathname === "/login") return null;

  const dashboardHref = user.role === "DIRECTIVO" ? "/dashboard/directivo" : "/dashboard";
  const navItems = [
    { label: "Inicio", href: dashboardHref, icon: LayoutDashboard },
    { label: "Alumnos", href: "/alumnos", icon: Users },
    { label: "Incidentes", href: "/incidentes", icon: ShieldAlert },
    { label: "Pases y retardos", href: "/eventos-rapidos", icon: Clock },
    { label: "Justificantes", href: "/justificantes", icon: FileCheck },
    { label: "Canalizaciones", href: "/canalizaciones", icon: Sparkles },
  ];

  if (user.role === "SUPER_USUARIO") {
    navItems.push({ label: "Analítica", href: "/dashboard/directivo", icon: BarChart3 });
    navItems.push({ label: "Administración", href: "/admin", icon: ShieldCheck });
  }

  const roleLabels: Record<string, string> = {
    SUPER_USUARIO: "Administrador",
    TRABAJADORA_SOCIAL: "Trabajo social",
    DIRECTIVO: "Directivo",
  };
  const roleIcon = user.role === "SUPER_USUARIO"
    ? <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
    : user.role === "DIRECTIVO"
      ? <Building2 className="h-3.5 w-3.5 text-amber-600" />
      : <Sparkles className="h-3.5 w-3.5 text-cyan-700" />;

  return (
    <header className="app-sidebar sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 text-slate-900 shadow-sm backdrop-blur-xl">
      <div className="app-sidebar-head mx-auto flex h-[4.25rem] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={dashboardHref} aria-label="Zentiva, ir al inicio" className="shrink-0 transition-opacity hover:opacity-80">
          <Logo size="md" variant="light" />
        </Link>

        <nav aria-label="Navegación principal" className="app-main-nav flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`app-nav-link flex min-h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 md:flex">
            {roleIcon}
            <span>{roleLabels[user.role] || "Usuario"}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 sm:gap-2.5 sm:pr-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-sm">
              {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="max-w-40 truncate text-xs font-semibold text-slate-900">{user.displayName || user.email}</p>
              <p className="max-w-40 truncate text-[11px] text-slate-500">{user.cargo || roleLabels[user.role]}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

    </header>
  );
};
