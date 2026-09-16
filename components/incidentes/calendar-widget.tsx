"use client";

import React, { useState } from "react";
import { Incidente } from "@/lib/types";
import { Calendar as CalendarIcon, UserX, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarWidgetProps {
  incidentes: Incidente[];
  onSelectIncidente?: (incidente: Incidente) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  incidentes,
  onSelectIncidente,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  const prevMonth = () => setSelectedMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedMonth(new Date(year, month + 1, 1));

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const suspenciones = incidentes.filter(
    (inc) => inc.dias_suspension > 0 && inc.reincorporacion_fecha
  );

  const citatorios = incidentes.filter(
    (inc) => inc.requiere_citatorio && inc.citatorio_fecha_hora
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Clean Linear-style Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-xs text-slate-800 tracking-wide uppercase">
            CALENDARIO DE SANCIONES Y CITATORIOS
          </h3>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={prevMonth}
            className="p-1 rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition"
            title="Mes anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded font-mono">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition"
            title="Mes siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Suspended Alumnos List */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5 text-rose-600" />
              Alumnos Suspendidos Actualmente
            </span>
            <span className="text-[11px] font-mono font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
              {suspenciones.length} Activos
            </span>
          </div>

          {suspenciones.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No hay suspensiones activas registradas.</p>
          ) : (
            <div className="space-y-2">
              {suspenciones.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncidente && onSelectIncidente(inc)}
                  className="p-3 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 rounded-lg cursor-pointer transition flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold font-mono text-slate-900">{inc.folio}</span>
                      <span className="text-xs font-medium text-slate-700">
                        {inc.implicados.map((i) => i.nombre_completo).join(", ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{inc.falta_nombre}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      Reincorporación: {inc.reincorporacion_fecha || "N/A"}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{inc.dias_suspension} días de sanción</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Citatorios */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Citatorios a Tutores Programados
            </span>
            <span className="text-[11px] font-mono font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              {citatorios.length} Programados
            </span>
          </div>

          {citatorios.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No hay citatorios pendientes.</p>
          ) : (
            <div className="space-y-2">
              {citatorios.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncidente && onSelectIncidente(inc)}
                  className="p-3 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 rounded-lg cursor-pointer transition flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold font-mono text-slate-900">{inc.folio}</span>
                      <span className="text-xs font-medium text-slate-700">
                        {inc.implicados.map((i) => i.nombre_completo).join(", ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{inc.falta_nombre}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      {inc.citatorio_fecha_hora || "Fecha a confirmar"}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {inc.tutor_notificado ? "✓ Tutor Notificado" : "⏳ Pendiente Notificar"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
