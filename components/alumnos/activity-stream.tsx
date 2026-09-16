"use client";

import React, { useEffect, useState } from "react";
import { EventoTimeline, TipoEventoTimeline } from "@/lib/types";
import { getEventosTimeline } from "@/lib/firestore-service";
import {
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  Calendar,
  Sparkles,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";

interface Props {
  alumnoMatricula: string;
}

export const ActivityStream: React.FC<Props> = ({ alumnoMatricula }) => {
  const [eventos, setEventos] = useState<EventoTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (alumnoMatricula) {
      loadTimeline();
    }
  }, [alumnoMatricula]);

  const loadTimeline = async () => {
    setLoading(true);
    const list = await getEventosTimeline(alumnoMatricula);
    setEventos(list);
    setLoading(false);
  };

  const getEventCardStyle = (tipo: TipoEventoTimeline) => {
    switch (tipo) {
      case "INCIDENTE_GRAVE":
        return {
          cardBg: "bg-rose-50/70 border-rose-200",
          iconBg: "bg-rose-100 text-rose-700 border-rose-300",
          badge: "bg-rose-100 text-rose-800 border-rose-300",
          label: "INCIDENTE GRAVE / FALTA",
          icon: ShieldAlert,
        };
      case "RETARDO":
        return {
          cardBg: "bg-amber-50/70 border-amber-200",
          iconBg: "bg-amber-100 text-amber-700 border-amber-300",
          badge: "bg-amber-100 text-amber-800 border-amber-300",
          label: "RETARDO DE ASISTENCIA",
          icon: Clock,
        };
      case "CANALIZACIÓN":
        return {
          cardBg: "bg-blue-50/70 border-blue-200",
          iconBg: "bg-blue-100 text-blue-700 border-blue-300",
          badge: "bg-blue-100 text-blue-800 border-blue-300",
          label: "CANALIZACIÓN PREVENTIVA",
          icon: Sparkles,
        };
      default:
        return {
          cardBg: "bg-slate-50 border-slate-200",
          iconBg: "bg-slate-100 text-slate-700 border-slate-300",
          badge: "bg-slate-100 text-slate-800 border-slate-300",
          label: "NOTA DE SEGUIMIENTO",
          icon: FileText,
        };
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-600" />
          <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wider">
            Historial de Eventos & Timeline (Activity Stream)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
          {eventos.length} Eventos Registrados
        </span>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-slate-500 font-mono">
          Cargando timeline de eventos...
        </div>
      ) : eventos.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 p-6 rounded-xl text-center text-xs text-slate-500">
          El alumno no cuenta con registros previos de incidentes o retardos en el plantel.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {eventos.map((evt) => {
            const style = getEventCardStyle(evt.tipo);
            const IconComponent = style.icon;

            return (
              <div key={evt.id} className="relative">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 top-1 w-6 h-6 rounded-full border flex items-center justify-center ${style.iconBg}`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>

                {/* Event Card */}
                <div className={`p-4 rounded-xl border ${style.cardBg} space-y-1.5 shadow-sm`}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="font-bold text-slate-900">{evt.titulo}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {evt.fecha}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {evt.descripcion}
                  </p>

                  <div className="text-[10px] text-slate-500 font-mono pt-1 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    Registrado por: <strong className="text-slate-700">{evt.autor}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
