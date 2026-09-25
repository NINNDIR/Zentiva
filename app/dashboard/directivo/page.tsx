"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Incidente, Alumno, RetardoRecord, CanalizacionExterna } from "@/lib/types";
import { getIncidentes, getAlumnos, getRetardos, getCanalizaciones } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth-context";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  ShieldAlert,
  Award,
  Building2,
  FileText,
  UserX,
  CheckCircle2,
  ArrowUpRight,
  PieChart,
} from "lucide-react";

export default function DirectivoDashboardPage() {
  const { user } = useAuth();
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [retardos, setRetardos] = useState<RetardoRecord[]>([]);
  const [canalizaciones, setCanalizaciones] = useState<CanalizacionExterna[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExecutiveData = async () => {
    setLoading(true);
    try {
      const [incList, alList, retList, canalList] = await Promise.all([
        getIncidentes(),
        getAlumnos(),
        getRetardos(),
        getCanalizaciones(),
      ]);
      setIncidentes(incList);
      setAlumnos(alList);
      setRetardos(retList);
      setCanalizaciones(canalList);
    } catch (err) {
      console.error("Error al cargar datos analíticos de directivos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutiveData();
  }, []);

  if (!user) return null;

  // ---------------- ANALÍTICA 1: REINCIDENCIAS DE ALUMNOS ----------------
  const reincidenciasMap = new Map<
    string,
    {
      alumno_matricula: string;
      alumno_nombre: string;
      grado_grupo: string;
      total_incidentes: number;
      dias_suspension_acumulados: number;
      leves: number;
      moderadas: number;
      graves: number;
      severas: number;
    }
  >();

  incidentes.forEach((inc) => {
    inc.implicados.forEach((imp) => {
      const key = imp.alumno_matricula;
      const current = reincidenciasMap.get(key) || {
        alumno_matricula: imp.alumno_matricula,
        alumno_nombre: imp.nombre_completo,
        grado_grupo: `${imp.grado}° ${imp.grupo}`,
        total_incidentes: 0,
        dias_suspension_acumulados: 0,
        leves: 0,
        moderadas: 0,
        graves: 0,
        severas: 0,
      };

      current.total_incidentes += 1;
      current.dias_suspension_acumulados += inc.dias_suspension || 0;

      if (inc.severidad === "LEVE") current.leves += 1;
      else if (inc.severidad === "MODERADA") current.moderadas += 1;
      else if (inc.severidad === "GRAVE") current.graves += 1;
      else if (inc.severidad === "SEVERA") current.severas += 1;

      reincidenciasMap.set(key, current);
    });
  });

  const alumnosReincidentes = Array.from(reincidenciasMap.values())
    .filter((a) => a.total_incidentes >= 2)
    .sort((a, b) => b.total_incidentes - a.total_incidentes);

  // ---------------- ANALÍTICA 2: GRUPOS CON MAYOR CONFLICTO ----------------
  const gruposMap = new Map<string, { grupo: string; count: number; severas_graves: number }>();

  incidentes.forEach((inc) => {
    inc.implicados.forEach((imp) => {
      const key = `${imp.grado}° ${imp.grupo}`;
      const curr = gruposMap.get(key) || { grupo: key, count: 0, severas_graves: 0 };
      curr.count += 1;
      if (inc.severidad === "GRAVE" || inc.severidad === "SEVERA") {
        curr.severas_graves += 1;
      }
      gruposMap.set(key, curr);
    });
  });

  const totalConflictosSum = Array.from(gruposMap.values()).reduce((acc, g) => acc + g.count, 0) || 1;

  const gruposRanking = Array.from(gruposMap.values()).sort((a, b) => b.count - a.count);

  // ---------------- ANALÍTICA 3: CONCENTRACIÓN DE REPORTES POR PERSONAL ----------------
  const personalMap = new Map<
    string,
    { nombre: string; total_reportes: number; abiertos: number; cerrados: number }
  >();

  incidentes.forEach((inc) => {
    const reporter = inc.creado_por_nombre || "Personal No Identificado";
    const curr = personalMap.get(reporter) || {
      nombre: reporter,
      total_reportes: 0,
      abiertos: 0,
      cerrados: 0,
    };
    curr.total_reportes += 1;
    if (inc.estatus === "CERRADO") curr.cerrados += 1;
    else curr.abiertos += 1;
    personalMap.set(reporter, curr);
  });

  const personalRanking = Array.from(personalMap.values()).sort(
    (a, b) => b.total_reportes - a.total_reportes
  );

  // Métricas generales
  const totalIncidentes = incidentes.length;
  const totalAlumnosMatriculados = alumnos.length;
  const totalRetardos = retardos.length;
  const totalCanalizaciones = canalizaciones.length;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                Dirección Escolar & Análisis Ejecutivo
              </span>
              <h1 className="text-2xl font-black tracking-tight mt-0.5">
                Dashboard Analítico de Directivos
              </h1>
              <p className="text-xs text-slate-300">
                Secundaria Felipe Carrillo Puerto — Consolidado de reincidencias, clima escolar y personal reportante.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold px-3 py-1.5 rounded-xl">
              Vista Directiva Oficial
            </span>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Incidentes</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalIncidentes}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Alumnos Reincidentes</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{alumnosReincidentes.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
              <UserX className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Retardos de Asistencia</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalRetardos}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Canalizaciones Externas</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalCanalizaciones}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 font-bold">
              <Building2 className="w-5 h-5 text-sky-600" />
            </div>
          </div>

        </div>

        {/* MAIN ANALYTICAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SECCIÓN 1: RANKING DE REINCIDENCIAS DE ALUMNOS */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Reincidencias de Alumnos (2+ Reportes)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Alumnos con faltas acumuladas y reincidencia disciplinaria activa.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {alumnosReincidentes.length} Alumnos
              </span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500">Cargando reincidencias...</div>
            ) : alumnosReincidentes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 italic">
                No hay alumnos reincidentes registrados en el plantel.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3">Alumno(a)</th>
                      <th className="py-2.5 px-3 text-center">Grado/Grupo</th>
                      <th className="py-2.5 px-3 text-center">Incidentes</th>
                      <th className="py-2.5 px-3 text-center">Días Suspensión</th>
                      <th className="py-2.5 px-3 text-right">Desglose Severidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alumnosReincidentes.map((r) => (
                      <tr key={r.alumno_matricula} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{r.alumno_nombre}</span>
                          <span className="text-[10px] text-slate-500 font-mono">[{r.alumno_matricula}]</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {r.grado_grupo}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-rose-700">
                          {r.total_incidentes}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-800 font-bold">
                          {r.dias_suspension_acumulados} d
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {r.graves + r.severas > 0 && (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-200">
                              {r.graves + r.severas} Gra/Sev
                            </span>
                          )}
                          {r.moderadas > 0 && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                              {r.moderadas} Mod
                            </span>
                          )}
                          {r.leves > 0 && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                              {r.leves} Lev
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: GRUPOS CON MAYOR CONFLICTO */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Grupos con Mayor Conflicto (Clima Escolar)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Concentración de incidencias y gravedad por Grado y Grupo.
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500">Cargando grupos...</div>
            ) : gruposRanking.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 italic">
                No hay conflictos por grupo registrados aún.
              </div>
            ) : (
              <div className="space-y-3">
                {gruposRanking.slice(0, 6).map((g) => {
                  const pct = Math.round((g.count / totalConflictosSum) * 100);
                  const isHigh = pct >= 25 || g.severas_graves >= 2;
                  return (
                    <div key={g.grupo} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900">Grupo: {g.grupo}</span>
                        <span className="font-mono text-slate-700 font-bold">
                          {g.count} incidentes ({pct}% del total)
                        </span>
                      </div>

                      {/* Visual intensity bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isHigh ? "bg-rose-600" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>Casos Graves/Severos: <strong className="text-slate-800">{g.severas_graves}</strong></span>
                        <span className={`font-bold ${isHigh ? "text-rose-700" : "text-amber-700"}`}>
                          {isHigh ? "Conflicto Alto" : "Conflicto Moderado"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* SECCIÓN 3: CONCENTRACIÓN DE REPORTES POR PERSONAL */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Concentración de Reportes por Personal Reportante (Docentes & Prefectura)
                </h3>
                <p className="text-xs text-slate-600">
                  Volumen de folios emitidos por cada miembro del personal educativo a su cargo.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 font-mono">
              {personalRanking.length} Reportantes
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Cargando personal reportante...</div>
          ) : personalRanking.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">
              No hay reportes asignados a personal reportante.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-5">Nombre del Personal</th>
                    <th className="py-3 px-5 text-center">Total Reportes Emitidos</th>
                    <th className="py-3 px-5 text-center">Tickets Abiertos</th>
                    <th className="py-3 px-5 text-center">Tickets Concluidos</th>
                    <th className="py-3 px-5 text-right">% Participación del Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personalRanking.map((p) => {
                    const pctShare = Math.round((p.total_reportes / (totalIncidentes || 1)) * 100);
                    return (
                      <tr key={p.nombre} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2">
                          <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span>{p.nombre}</span>
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-black text-slate-900 text-sm">
                          {p.total_reportes}
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-bold text-rose-700">
                          {p.abiertos}
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-bold text-emerald-700">
                          {p.cerrados}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span className="bg-blue-50 text-blue-800 font-mono font-bold px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            {pctShare}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
