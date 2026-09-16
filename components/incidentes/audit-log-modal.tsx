"use client";

import React, { useEffect, useState } from "react";
import { AuditLogEntry } from "@/lib/types";
import { getAuditLogEntries } from "@/lib/firestore-service";
import { History, X, Clock, User, ArrowRight } from "lucide-react";

interface AuditLogModalProps {
  incidenteId: string;
  folio: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  incidenteId,
  folio,
  isOpen,
  onClose,
}) => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && incidenteId) {
      setLoading(true);
      getAuditLogEntries(incidenteId)
        .then((data) => setEntries(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, incidenteId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm tracking-wide">HISTORIAL DE AUDITORÍA DE CAMBIOS</h3>
              <p className="text-[11px] text-slate-400 font-mono">Folio Ticket: {folio}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Cargando registros de auditoría...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 font-medium">
                No existen registros de modificación o auditoría para este expediente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-cyan-700" />
                      <span className="text-xs font-bold text-slate-800">{entry.usuario_nombre}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.fecha_hora).toLocaleString("es-MX")}
                    </span>
                  </div>

                  {/* Modified fields summary */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-500">
                      Campos Modificados ({entry.campos_modificados.length}):
                    </span>
                    <div className="space-y-1.5">
                      {entry.campos_modificados.map((campo) => (
                        <div key={campo} className="text-xs bg-white p-2 rounded border border-slate-200">
                          <span className="font-mono font-bold text-slate-700 uppercase block mb-1">
                            {campo.replace(/_/g, " ")}:
                          </span>
                          <div className="flex items-center space-x-2 text-[11px]">
                            <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded line-through">
                              {JSON.stringify(entry.valor_anterior[campo]) ?? "vacío"}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-emerald-700 bg-emerald-50 font-semibold px-1.5 py-0.5 rounded">
                              {JSON.stringify(entry.valor_nuevo[campo]) ?? "vacío"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
};
