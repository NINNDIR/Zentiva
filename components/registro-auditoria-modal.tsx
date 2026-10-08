"use client";

import React, { useEffect, useState } from "react";
import { X, History, LoaderCircle } from "lucide-react";
import { getRegistroAuditoria } from "@/lib/firestore-service";
import { RegistroAuditoria } from "@/lib/types";

interface Props {
  isOpen: boolean;
  coleccion: "salidas_extraordinarias" | "justificantes";
  registroId: string;
  onClose: () => void;
}

const displayValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const RegistroAuditoriaModal: React.FC<Props> = ({ isOpen, coleccion, registroId, onClose }) => {
  const [entries, setEntries] = useState<RegistroAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !registroId) return;
    setLoading(true);
    setError("");
    getRegistroAuditoria(coleccion, registroId)
      .then(setEntries)
      .catch(() => setError("No se pudo cargar el historial de cambios."))
      .finally(() => setLoading(false));
  }, [isOpen, coleccion, registroId]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Historial de cambios">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            <h2 className="text-base font-bold text-slate-900">Historial de cambios</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar historial" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </header>
        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-5">
          {loading ? <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Cargando historial…</div>
            : error ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>
            : entries.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Este registro aún no tiene modificaciones auditadas.</p>
            : entries.map((entry) => (
              <article key={entry.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <strong className="text-slate-900">{entry.usuario_nombre}</strong>
                  <time dateTime={entry.fecha_hora}>{new Date(entry.fecha_hora).toLocaleString("es-MX")}</time>
                </div>
                <div className="space-y-2">
                  {entry.campos_modificados.map((field) => (
                    <div key={field} className="grid grid-cols-[minmax(100px,.6fr)_1fr_1fr] gap-3 border-t border-slate-100 pt-2 text-xs">
                      <strong className="break-words text-slate-700">{field.replace(/_/g, " ")}</strong>
                      <span className="break-words text-slate-500" title={displayValue(entry.valor_anterior[field])}>Antes: {displayValue(entry.valor_anterior[field])}</span>
                      <span className="break-words font-medium text-slate-900" title={displayValue(entry.valor_nuevo[field])}>Ahora: {displayValue(entry.valor_nuevo[field])}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
};
