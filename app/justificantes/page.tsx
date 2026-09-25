"use client";

import React, { useState, useEffect } from "react";
import { JustificanteMedico } from "@/lib/types";
import { getJustificantes } from "@/lib/firestore-service";
import { JustificanteModal } from "@/components/justificantes/justificante-modal";
import { useAuth } from "@/lib/auth-context";
import {
  FileCheck,
  Search,
  Calendar,
  Building2,
  Stethoscope,
  Plus,
  Filter,
  Users,
} from "lucide-react";

export default function JustificantesPage() {
  const { user } = useAuth();
  const [justificantes, setJustificantes] = useState<JustificanteMedico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getJustificantes();
      setJustificantes(data);
    } catch (err) {
      console.error("Error al cargar justificantes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  const filteredJustificantes = justificantes.filter((j) => {
    const query = searchQuery.toLowerCase();
    return (
      j.alumno_nombre.toLowerCase().includes(query) ||
      j.alumno_matricula.toLowerCase().includes(query) ||
      j.folio.toLowerCase().includes(query) ||
      j.motivo_medico.toLowerCase().includes(query)
    );
  });

  const totalJustificantes = justificantes.length;
  const totalDiasAusencia = justificantes.reduce((sum, j) => sum + (j.dias_totales || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Módulo de Salud & Asistencia Escolar
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <FileCheck className="w-6 h-6 text-emerald-600" />
              Gestión de Justificantes Médicos
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Control oficial de faltas justificadas por salud y sincronización con el expediente escolar.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Justificante Médico</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Justificantes Médicos Expedidos
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalJustificantes}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <FileCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Días Totales de Ausencia Justificados
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalDiasAusencia} días</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por folio, alumno o motivo médico..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Cargando justificantes médicos...</div>
          ) : filteredJustificantes.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-600 font-medium">
              No se han registrado justificantes médicos en Firestore.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                    <th className="py-3 px-5">Folio / Emisión</th>
                    <th className="py-3 px-5">Alumno(a)</th>
                    <th className="py-3 px-5">Rango de Ausencia</th>
                    <th className="py-3 px-5 text-center">Días Justificados</th>
                    <th className="py-3 px-5">Motivo / Institución</th>
                    <th className="py-3 px-5 text-right">Registrado Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJustificantes.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5 font-mono">
                        <span className="font-bold text-emerald-800 block">{j.folio}</span>
                        <span className="text-[10px] text-slate-500">{j.fecha_emision}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-900 block">{j.alumno_nombre}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          [{j.alumno_matricula}] ({j.grado_grupo})
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-[11px] text-slate-700 font-medium">
                        {j.fecha_inicio} &rarr; {j.fecha_fin}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-300 font-mono">
                          {j.dias_totales} {j.dias_totales === 1 ? "día" : "días"}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800 block">{j.motivo_medico}</span>
                        <span className="text-[10px] text-slate-500">
                          {j.institucion_medica || "Sin especificar"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right text-slate-700 font-semibold">
                        {j.registrado_por_nombre}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        <JustificanteModal
          isOpen={isModalOpen}
          currentUser={user}
          onClose={() => setIsModalOpen(false)}
          onSaved={loadData}
        />
      </div>
    </div>
  );
}
