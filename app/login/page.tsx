"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { OFFICIAL_PLANTEL } from "@/lib/types";
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function LoginPage() {
  const { loginWithEmail, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor ingresa tu correo electrónico y contraseña.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError("Credenciales no válidas. Por favor verifica tu correo y contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-300 shadow-2xl rounded-2xl p-8 space-y-6">
        
        {/* Logo and Institution Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center justify-center p-2 bg-slate-900 rounded-xl shadow-sm">
            <img
              src="/solologo.png"
              alt="Zentiva"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-2xl font-black text-slate-900 tracking-tight font-sans">
              <span>ZENT</span>
              <span className="text-cyan-600">IVA</span>
              <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block ml-0.5"></span>
            </div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-0.5">
              Trabajo Social Escolar
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {OFFICIAL_PLANTEL}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-200"></div>

        {/* Form Title */}
        <div className="text-left">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Acceso Institucional
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Ingresa con tu correo y contraseña asignados.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@zentiva.edu.mx"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>{submitting ? "Iniciando sesión..." : "Ingresar al Sistema"}</span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </button>
        </form>

        {/* Institutional Security Notice */}
        <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-100">
          Uso oficial restringido • {OFFICIAL_PLANTEL}
        </div>

      </div>
    </div>
  );
}
