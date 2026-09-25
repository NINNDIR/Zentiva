"use client";

import React, { useState, useEffect } from "react";
import { CanalizacionExterna, EstatusCanalizacion } from "@/lib/types";
import { getCanalizaciones, updateCanalizacionEstatus } from "@/lib/firestore-service";
import { CanalizacionModal } from "@/components/canalizaciones/canalizacion-modal";
import { useAuth } from "@/lib/auth-context";
import {
  Sparkles,
  Search,
  Building2,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function CanalizacionesPage() {
  const { user } = useAuth();
  const [canalizaciones, setCanalizaciones] = useState<CanalizacionExterna[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [estatusFilter, setEstatusFilter] = useState<string>("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCanalizaciones();
      setCanalizaciones(data);
    } catch (err) {
      console.error("Error al cargar canalizaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  const handleStatusChange = async (id: string, newStatus: EstatusCanalizacion) => {
    try {
      await updateCanalizacionEstatus(id, newStatus);
      await loadData();
    } catch (err) {
      console.error("Error al actualizar estatus de canalización:", err);
    }
  };

  const filteredCanalizaciones = canalizaciones.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      c.alumno_nombre.toLowerCase().includes(query) ||
      c.alumno_matricula.toLowerCase().includes(query) ||
      c.folio.toLowerCase().includes(query) ||
      c.institucion_destino.toLowerCase().includes(query) ||
      c.motivo_canalizacion.toLowerCase().includes(query);

    const matchesStatus = estatusFilter === "TODOS" || c.estatus === estatusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCount = canalizaciones.length;
  const enProcesoCount = canalizaciones.filter((c) => c.estatus === "EN_PROCESO" || c.estatus === "PENDIENTE").length;
  const atendidasCount = canalizaciones.filter((c) => c.estatus === "ATENDIDO" || c.estatus === "FINALIZADO").length;

  const getStatusBadge = (estatus: EstatusCanalizacion) => {
    switch (estatus) {
      case "PENDIENTE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "EN_PROCESO":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ATENDIDO":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "FINALIZADO":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block">
              Red Interinstitucional de Apoyo a Menores
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <Sparkles className="w-6 h-6 text-sky-600" />
              Canalizaciones Externas & Derivaciones
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Seguimiento a canalizaciones con DIF, USAER, Salud Mental y dependencias gubernamentales.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Canalización Externa</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Total Canalizaciones
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 font-bold">
              <Sparkles className="w-5 h-5 text-sky-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Pendientes / En Proceso
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">{enProcesoCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Atendidas / Concluidas
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">{atendidasCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por folio, alumno o institución..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={estatusFilter}
              onChange={(e) => setEstatusFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              <option value="TODOS">Todos los Estatus</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="ATENDIDO">Atendido</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Cargando canalizaciones externas...</div>
          ) : filteredCanalizaciones.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-600 font-medium">
              No se han registrado canalizaciones externas en Firestore.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                    <th className="py-3 px-5">Folio / Fecha</th>
                    <th className="py-3 px-5">Alumno(a)</th>
                    <th className="py-3 px-5">Institución Destino</th>
                    <th className="py-3 px-5">Motivo / Situación</th>
                    <th className="py-3 px-5 text-center">Estatus de Seguimiento</th>
                    <th className="py-3 px-5 text-center">Tutor Notificado</th>
                    <th className="py-3 px-5 text-right">Registrado Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCanalizaciones.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5 font-mono">
                        <span className="font-bold text-sky-800 block">{c.folio}</span>
                        <span className="text-[10px] text-slate-500">{c.fecha_canalizacion}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-900 block">{c.alumno_nombre}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          [{c.alumno_matricula}] ({c.grado_grupo})
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-900 block">
                          {c.institucion_destino}
                        </span>
                      </td>
                      <td className="py-4 px-5 max-w-xs truncate text-slate-700 font-medium">
                        {c.motivo_canalizacion}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <select
                          value={c.estatus}
                          onChange={(e) => handleStatusChange(c.id, e.target.value as EstatusCanalizacion)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${getStatusBadge(c.estatus)}`}
                        >
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="EN_PROCESO">EN PROCESO</option>
                          <option value="ATENDIDO">ATENDIDO</option>
                          <option value="FINALIZADO">FINALIZADO</option>
                        </select>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {c.tutor_notificado ? (
                          <span className="inline-flex items-center text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Notificado
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold text-[10px]">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right text-slate-700 font-semibold">
                        {c.registrado_por_nombre}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        <CanalizacionModal
          isOpen={isModalOpen}
          currentUser={user}
          onClose={() => setIsModalOpen(false)}
          onSaved={loadData}
        />
      </div>
    </div>
  );
}
