"use client";

import React, { useState, useEffect } from "react";
import { EventoRapido } from "@/lib/types";
import { getEventosRapidos } from "@/lib/firestore-service";
import { PaseSalidaModal } from "@/components/eventos-rapidos/pase-salida-modal";
import { useAuth } from "@/lib/auth-context";
import { Clock, LogOut, Search, Filter, CheckSquare } from "lucide-react";

export default function EventosRapidosPage() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<EventoRapido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getEventosRapidos();
      setEventos(data);
    } catch (err) {
      console.error("Error al cargar eventos rápidos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  const filteredEventos = eventos.filter((ev) => {
    const matchesSearch =
      ev.alumno_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.alumno_matricula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.quien_retira_nombre && ev.quien_retira_nombre.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTipo = tipoFilter === "TODOS" || ev.tipo === tipoFilter;

    return matchesSearch && matchesTipo;
  });

  const pasesCount = eventos.filter((e) => e.tipo === "PASE_SALIDA").length;
  const retardosCount = eventos.filter((e) => e.tipo === "RETARDO_MASIVO").length;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
              Control de Asistencia & Retiros Extraordinarios
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <Clock className="w-6 h-6 text-blue-600" />
              Pase de Salida & Control de Retardos
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Registro oficial de retiros anticipados con validación de tutela y resguardo físico de INE.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>+ Emitir Pase de Salida</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Pases de Salida Emitidos</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{pasesCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <LogOut className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Retardos de Asistencia</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{retardosCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por alumno o tutor que retira..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="TODOS">Todos los Eventos</option>
              <option value="PASE_SALIDA">Pase de Salida</option>
              <option value="RETARDO_MASIVO">Retardo de Asistencia</option>
            </select>
          </div>
        </div>

        {/* Table of Events */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Cargando registros...</div>
          ) : filteredEventos.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-600 font-medium">
              No hay eventos rápidos ni pases de salida registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                    <th className="py-3 px-5">Tipo / Fecha</th>
                    <th className="py-3 px-5">Alumno(a)</th>
                    <th className="py-3 px-5">Persona que Retira / Relación</th>
                    <th className="py-3 px-5">Medio Autorización</th>
                    <th className="py-3 px-5 text-center">INE Resguardada</th>
                    <th className="py-3 px-5 text-right">Registrado Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEventos.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-blue-900 block">{ev.tipo.replace("_", " ")}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{ev.fecha_hora}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-900 block">{ev.alumno_nombre}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          [{ev.alumno_matricula}] ({ev.grado_grupo})
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800 block">
                          {ev.quien_retira_nombre || "N/A"}
                        </span>
                        <span className="text-[10px] text-slate-600 font-medium">
                          {ev.quien_retira_parentesco || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200 font-medium">
                          {ev.medio_autorizacion || "Presencial"}
                        </span>
                        {ev.ine_folio && (
                          <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                            INE: {ev.ine_folio}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        {ev.ine_fisica_resguardada ? (
                          <span className="inline-flex items-center text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold text-[10px]">
                            <CheckSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Resguardada
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right text-slate-700 font-semibold">
                        {ev.registrado_por}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pase de Salida Modal */}
        <PaseSalidaModal
          isOpen={isModalOpen}
          currentUser={user}
          onClose={() => setIsModalOpen(false)}
          onSaved={loadData}
        />
      </div>
    </div>
  );
}
