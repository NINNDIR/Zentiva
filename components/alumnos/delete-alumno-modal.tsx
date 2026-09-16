"use client";

import React, { useState } from "react";
import { Alumno } from "@/lib/types";
import { deactivateAlumno, deleteAlumnoPermanently } from "@/lib/firestore-service";
import { AlertTriangle, Trash2, UserX, X, ShieldAlert } from "lucide-react";

interface Props {
  isOpen: boolean;
  alumno: Alumno | null;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteAlumnoModal: React.FC<Props> = ({
  isOpen,
  alumno,
  onClose,
  onDeleted,
}) => {
  const [actionType, setActionType] = useState<"DEACTIVATE" | "DELETE">("DEACTIVATE");
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !alumno) return null;

  const handleConfirmAction = async () => {
    setProcessing(true);
    try {
      if (actionType === "DEACTIVATE") {
        await deactivateAlumno(alumno.matricula, "BAJA");
      } else {
        await deleteAlumnoPermanently(alumno.matricula);
      }
      setProcessing(false);
      onDeleted();
      onClose();
    } catch (err: any) {
      setProcessing(false);
      alert("Error al procesar la solicitud: " + (err.message || "Error desconocido"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        
        {/* Header Warning */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">
              ¿Gestionar Baja o Eliminación de Registro?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Expediente: <strong className="text-slate-900">{alumno.nombre_completo}</strong> (Matrícula <span className="font-mono font-bold text-cyan-700">{alumno.matricula}</span>)
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Notice */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-rose-950 font-mono">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            ADVERTENCIA DE INTEGRIDAD LEGAL
          </span>
          <p className="leading-relaxed text-[11px] text-rose-800">
            Los expedientes de Trabajo Social contienen bitácoras de incidentes y canalizaciones que podrían ser requeridas por autoridades educativas o DIF. Se recomienda la <strong>Baja Institucional</strong> para preservar el archivo.
          </p>
        </div>

        {/* Action Radio Options */}
        <div className="space-y-3">
          {/* Option 1: Deactivate / Baja */}
          <label
            onClick={() => setActionType("DEACTIVATE")}
            className={`p-3.5 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
              actionType === "DEACTIVATE"
                ? "bg-amber-50/80 border-amber-400 shadow-sm"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <input
              type="radio"
              name="actionType"
              checked={actionType === "DEACTIVATE"}
              onChange={() => setActionType("DEACTIVATE")}
              className="mt-1 text-amber-600 focus:ring-amber-500"
            />
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-amber-700" />
                (Recomendado) Dar de Baja / Desactivar Expediente
              </span>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                Cambia el estatus a "BAJA". El expediente se oculta del listado activo habitual, pero conserva su historial legal en Firestore y se recupera si se busca directamente por matrícula o filtro.
              </p>
            </div>
          </label>

          {/* Option 2: Delete Permanently */}
          <label
            onClick={() => setActionType("DELETE")}
            className={`p-3.5 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
              actionType === "DELETE"
                ? "bg-rose-50/80 border-rose-400 shadow-sm"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <input
              type="radio"
              name="actionType"
              checked={actionType === "DELETE"}
              onChange={() => setActionType("DELETE")}
              className="mt-1 text-rose-600 focus:ring-rose-500"
            />
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-700" />
                Eliminar Definitivamente (Permanente)
              </span>
              <p className="text-[11px] text-rose-900/80 leading-relaxed">
                Elimina permanentemente el documento del alumno de Firestore. Esta acción no se puede deshacer.
              </p>
            </div>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex justify-end space-x-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmAction}
            disabled={processing}
            className={`px-5 py-2 text-white font-bold rounded-lg text-xs transition shadow-sm disabled:opacity-50 ${
              actionType === "DEACTIVATE"
                ? "bg-amber-600 hover:bg-amber-500"
                : "bg-rose-600 hover:bg-rose-500"
            }`}
          >
            <span>
              {processing
                ? "Procesando..."
                : actionType === "DEACTIVATE"
                ? "Confirmar Baja Institucional"
                : "Eliminar Permanentemente"}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
