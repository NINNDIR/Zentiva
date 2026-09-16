"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { useAuth } from "@/lib/auth-context";
import { DEMO_USERS } from "@/lib/types";
import {
  Users,
  LayoutDashboard,
  ShieldAlert,
  Clock,
  LogOut,
  Sparkles,
  Building2,
  UserCheck,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Do not render navbar if not logged in or on login page
  if (!user || pathname === "/login") return null;

  const roleInfo = DEMO_USERS[user.role] || DEMO_USERS.TRABAJADORA_SOCIAL;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Alumnos & Expedientes", href: "/alumnos", icon: Users },
    { label: "Incidentes", href: "/incidentes", icon: ShieldAlert },
    { label: "Pase de Salida & Retardos", href: "/eventos-rapidos", icon: Clock },
  ];

  if (user.role === "SUPER_USUARIO" || user.role === "TRABAJADORA_SOCIAL") {
    navItems.push({ label: "Catálogo Faltas", href: "/admin/faltas", icon: Sparkles });
  }

  const getRoleIcon = () => {
    switch (user.role) {
      case "SUPER_USUARIO":
        return <UserCheck className="w-3.5 h-3.5 text-purple-300" />;
      case "TRABAJADORA_SOCIAL":
        return <Sparkles className="w-3.5 h-3.5 text-cyan-300" />;
      case "DIRECTIVO":
        return <Building2 className="w-3.5 h-3.5 text-amber-300" />;
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Logo & Main Navigation Links */}
        <div className="flex items-center space-x-8">
          <Link href="/dashboard" className="flex items-center hover:opacity-95 transition">
            <Logo size="md" variant="navy" />
          </Link>

          <nav className="hidden md:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-200 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-cyan-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center space-x-3">
          {/* Active Role Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs">
            {getRoleIcon()}
            <span>{user.role.replace("_", " ")}</span>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center space-x-2.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow-xs">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {user.displayName?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-100 leading-tight">
                {user.displayName}
              </span>
              <span className="text-[10px] text-slate-300 font-medium">
                {user.cargo}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 text-slate-300 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
