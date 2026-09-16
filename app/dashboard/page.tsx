"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Incidente, Alumno, EventoRapido, obtenerSLAInfo } from "@/lib/types";
import { getIncidentes, getAlumnos, getEventosRapidos } from "@/lib/firestore-service";
import { SLABadge } from "@/components/incidentes/sla-badge";
import { PaseSalidaModal } from "@/components/eventos-rapidos/pase-salida-modal";
import {
  ShieldAlert,
  Plus,
  LogOut,
  FileCheck2,
  Clock,
  Calendar,
  UserCheck,
  AlertTriangle,
  Eye,
  Phone,
  ArrowRight,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [eventos, setEventos] = useState<EventoRapido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaseModalOpen, setIsPaseModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incList, alList, evList] = await Promise.all([
        getIncidentes(),
        getAlumnos(),
        getEventosRapidos(),
      ]);
      setIncidentes(incList);
      setAlumnos(alList);
      setEventos(evList);
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  // 1. Citatorios para Hoy / Próximos
  const citatoriosPendientes = incidentes.filter(
    (inc) => inc.requiere_citatorio && inc.citatorio_fecha_hora
  );

  // 2. Reincorporaciones (Alumnos con suspensión activa)
  const reincorporaciones = incidentes.filter(
    (inc) => inc.dias_suspension > 0 && inc.reincorporacion_fecha
  );

  // 3. SLAs por vencer (> 24h) o vencidos (> 48h)
  const slasUrgentes = incidentes.filter((inc) => {
    if (inc.estatus === "CERRADO" && inc.firma_escaneada_adjunta) return false;
    const sla = obtenerSLAInfo(inc.fecha_hora, inc.estatus, inc.firma_escaneada_adjunta);
    return sla.color === "AMARILLO" || sla.color === "ROJO";
  });

  // Métricas
  const countAbiertos = incidentes.filter((i) => i.estatus === "ABIERTO").length;
  const countCitatorios = citatoriosPendientes.length;
  const countSuspendidos = reincorporaciones.length;
  const countPases = eventos.filter((e) => e.tipo === "PASE_SALIDA").length;

  // Helper para buscar teléfono de tutor
  const getTutorInfo = (matricula: string) => {
    const al = alumnos.find((a) => a.matricula === matricula);
    if (!al || !al.contactos_oficiales || al.contactos_oficiales.length === 0) return null;
    return al.contactos_oficiales.find((c) => c.es_tutor_legal) || al.contactos_oficiales[0];
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        
        {/* ========================================================
            SECCIÓN 1: BARRA DE ACCIONES RÁPIDAS (OPERATIVA TS)
           ======================================================== */}
        <div className="bg-white border border-slate-300 shadow-sm rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
              Operación Diaria de Trabajo Social
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Panel de Atención Inmediata y Tareas del Día
            </h1>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Link
              href="/incidentes/nuevo"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Incidente</span>
            </Link>

            <button
              onClick={() => setIsPaseModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>+ Pase de Salida</span>
            </button>

            <Link
              href="/alumnos"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>+ Justificante Médico</span>
            </Link>

            <Link
              href="/eventos-rapidos"
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>+ Registrar Retardo</span>
            </Link>
          </div>
        </div>

        {/* ========================================================
            SECCIÓN 2: ATENCIÓN INMEDIATA DEL DÍA (3 COLUMNAS)
           ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Columna A: Citatorios para Hoy / Próximos */}
          <div className="bg-white border border-slate-300 shadow-sm rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Citatorios para Hoy
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium">Reuniones con tutores</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {citatoriosPendientes.length}
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {citatoriosPendientes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No hay citatorios programados para hoy.
                  </p>
                ) : (
                  citatoriosPendientes.slice(0, 3).map((inc) => {
                    const imp = inc.implicados[0];
                    const tutor = imp ? getTutorInfo(imp.alumno_matricula) : null;
                    return (
                      <div
                        key={inc.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {imp?.nombre_completo || "Alumno"}
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                            {inc.citatorio_fecha_hora}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 line-clamp-1">
                          Motivo: <span className="font-semibold">{inc.falta_nombre}</span>
                        </p>
                        {tutor && (
                          <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200">
                            <span>Tutor: {tutor.nombre} ({tutor.parentesco})</span>
                            {tutor.telefono && (
                              <a
                                href={`tel:${tutor.telefono}`}
                                className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {tutor.telefono}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Link
              href="/incidentes"
              className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center justify-between pt-2 border-t border-slate-100"
            >
              <span>Ver todos los citatorios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Columna B: Reincorporaciones del Día */}
          <div className="bg-white border border-slate-300 shadow-sm rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Reincorporaciones
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium">Término de suspensión</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {reincorporaciones.length}
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {reincorporaciones.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No hay suspensiones concluyendo hoy.
                  </p>
                ) : (
                  reincorporaciones.slice(0, 3).map((inc) => (
                    <div
                      key={inc.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {inc.implicados.map((i) => i.nombre_completo).join(", ")}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Regreso: {inc.reincorporacion_fecha}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700">
                        Sanción: <span className="font-semibold">{inc.dias_suspension} días hábiles</span>
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">
                        Expediente: {inc.folio} — {inc.falta_nombre}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/incidentes"
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center justify-between pt-2 border-t border-slate-100"
            >
              <span>Ver sanciones activas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Columna C: SLA por Vencer / Vencidos */}
          <div className="bg-white border border-slate-300 shadow-sm rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      SLA por Vencer / Vencidos
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium">Tickets que superan 24/48h</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                  {slasUrgentes.length}
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {slasUrgentes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    ¡Excelente! No hay tickets con SLA vencido.
                  </p>
                ) : (
                  slasUrgentes.slice(0, 3).map((inc) => (
                    <div
                      key={inc.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {inc.folio}
                        </span>
                        <SLABadge
                          fechaHora={inc.fecha_hora}
                          estatus={inc.estatus}
                          tieneFirma={inc.firma_escaneada_adjunta}
                        />
                      </div>
                      <p className="text-[11px] text-slate-800 font-medium line-clamp-1">
                        {inc.implicados.map((i) => i.nombre_completo).join(", ")}
                      </p>
                      <p className="text-[10px] text-slate-600 line-clamp-1">
                        Falta: {inc.falta_nombre}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/incidentes"
              className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center justify-between pt-2 border-t border-slate-100"
            >
              <span>Ver tickets prioritarios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

        {/* ========================================================
            SECCIÓN 3: MÉTRICAS Y TABLA DE INCIDENTES RECIENTES
           ======================================================== */}
        <div className="space-y-4">
          
          {/* Métricas Activas (Clean KPI Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Incidentes Abiertos</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{countAbiertos}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Citatorios Pendientes</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{countCitatorios}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Alumnos Suspendidos</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{countSuspendidos}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Pases de Salida</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{countPases}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
                <LogOut className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* Tabla de Incidentes Recientes */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Incidentes Recientes & Estado de SLA
                </h3>
                <p className="text-xs text-slate-600">
                  Control de bitácora y convenios vinculantes de la Secundaria Felipe Carrillo Puerto
                </p>
              </div>

              <Link
                href="/incidentes"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 transition flex items-center gap-1"
              >
                <span>Ver todos los reportes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Cargando reportes...</div>
            ) : incidentes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No hay incidentes registrados aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-5">Folio / Fecha</th>
                      <th className="py-3 px-5">Alumno(s) Implicados</th>
                      <th className="py-3 px-5">Falta / Conducta</th>
                      <th className="py-3 px-5 text-center">SLA Atención</th>
                      <th className="py-3 px-5 text-center">Estatus</th>
                      <th className="py-3 px-5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {incidentes.slice(0, 6).map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-5">
                          <span className="font-mono font-bold text-slate-900 block">{inc.folio}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{inc.fecha_hora}</span>
                        </td>
                        <td className="py-3.5 px-5">
                          {inc.implicados.map((imp, idx) => (
                            <div key={idx} className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-800">{imp.nombre_completo}</span>
                              <span className="text-[10px] font-mono text-slate-500">
                                ({imp.grado}° {imp.grupo})
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-semibold text-slate-900 block line-clamp-1">{inc.falta_nombre}</span>
                          <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {inc.categoria}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <SLABadge
                            fechaHora={inc.fecha_hora}
                            estatus={inc.estatus}
                            tieneFirma={inc.firma_escaneada_adjunta}
                          />
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              inc.estatus === "ABIERTO"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : inc.estatus === "EN PROCESO"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {inc.estatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Link
                            href={`/incidentes/${inc.id}`}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>Ver Ticket</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Pase de Salida Modal */}
      <PaseSalidaModal
        isOpen={isPaseModalOpen}
        currentUser={user}
        onClose={() => setIsPaseModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
}
