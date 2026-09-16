"use client";

import React, { useState, useEffect } from "react";
import { Incidente, EstatusIncidente } from "@/lib/types";
import { getIncidentes } from "@/lib/firestore-service";
import { SLABadge } from "@/components/incidentes/sla-badge";
import { CalendarWidget } from "@/components/incidentes/calendar-widget";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { ShieldAlert, Plus, Search, Filter, Eye, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

export default function IncidentesPage() {
  const { user } = useAuth();
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [estatusFilter, setEstatusFilter] = useState<string>("TODOS");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getIncidentes();
      setIncidentes(data);
    } catch (err) {
      console.error("Error al cargar incidentes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  const filteredIncidentes = incidentes.filter((inc) => {
    const matchesSearch =
      inc.folio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.falta_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.implicados.some((i) => i.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = estatusFilter === "TODOS" || inc.estatus === estatusFilter;

    return matchesSearch && matchesStatus;
  });

  const countAbiertos = incidentes.filter((i) => i.estatus === "ABIERTO").length;
  const countEnProceso = incidentes.filter((i) => i.estatus === "EN PROCESO").length;
  const countCerrados = incidentes.filter((i) => i.estatus === "CERRADO").length;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
              Módulo de Convivencia Escolar
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <ShieldAlert className="w-6 h-6 text-blue-600" />
              Gestión de Incidentes & Semaforización SLA
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Seguimiento oficial de reportes, convenios vinculantes y cumplimiento del marco legal escolar.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/incidentes/nuevo"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar Incidente</span>
            </Link>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Incidentes Abiertos</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{countAbiertos}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">En Proceso</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{countEnProceso}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Resueltos y Firmados</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{countCerrados}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

        </div>

        {/* Main Grid: Incident Table (2 cols) + Calendar Widget (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Table Container (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por folio, alumno o falta..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={estatusFilter}
                  onChange={(e) => setEstatusFilter(e.target.value)}
                  className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="TODOS">Todos los Estatus</option>
                  <option value="ABIERTO">ABIERTO</option>
                  <option value="EN PROCESO">EN PROCESO</option>
                  <option value="CERRADO">CERRADO</option>
                </select>
              </div>
            </div>

            {/* Incidente Table with Soft Header & Row Padding */}
            <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">Cargando incidentes...</div>
              ) : filteredIncidentes.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">No se encontraron incidentes registrados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                        <th className="py-3 px-5">Folio / Fecha</th>
                        <th className="py-3 px-5">Alumno(s) Implicados</th>
                        <th className="py-3 px-5">Falta & Categoría</th>
                        <th className="py-3 px-5 text-center">SLA Atención</th>
                        <th className="py-3 px-5 text-center">Estatus</th>
                        <th className="py-3 px-5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredIncidentes.map((inc) => (
                        <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-5">
                            <span className="font-mono font-bold text-slate-900 block">{inc.folio}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{inc.fecha_hora}</span>
                          </td>
                          <td className="py-4 px-5">
                            {inc.implicados.map((imp, idx) => (
                              <div key={idx} className="flex items-center space-x-1.5">
                                <span className="font-bold text-slate-800">{imp.nombre_completo}</span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  ({imp.grado}° {imp.grupo}) - {imp.rol_implicado}
                                </span>
                              </div>
                            ))}
                          </td>
                          <td className="py-4 px-5">
                            <span className="font-semibold text-slate-900 block line-clamp-1">{inc.falta_nombre}</span>
                            <span className="text-[10px] text-slate-700 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {inc.categoria}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <SLABadge
                              fechaHora={inc.fecha_hora}
                              estatus={inc.estatus}
                              tieneFirma={inc.firma_escaneada_adjunta}
                            />
                          </td>
                          <td className="py-4 px-5 text-center">
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
                          <td className="py-4 px-5 text-right">
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

          {/* Calendar Widget Area (1 Col) */}
          <div className="lg:col-span-1">
            <CalendarWidget incidentes={incidentes} />
          </div>

        </div>
      </div>
    </div>
  );
}
