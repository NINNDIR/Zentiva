"use client";

import React, { useState, useEffect } from "react";
import { Alumno, UserProfile, CanalizacionExterna, EstatusCanalizacion } from "@/lib/types";
import { subscribeAlumnos, addCanalizacion } from "@/lib/firestore-service";
import {
  X,
  Sparkles,
  Search,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle2,
  FileText,
  UserCheck,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onSaved: () => void;
}

const INSTITUCIONES_DESTINO = [
  "DIF Municipal / Sistema DIF Estatal",
  "USAER - Unidad de Serv. de Apoyo a la Educación Regular",
  "Centro de Salud Mental / CAPSI / CISAME",
  "CAPEP - Centro de Atención Psicopedagógica de Educ. Preescolar",
  "Trabajo Social / Asistencia Social Externa",
  "PANNARTI - Atención a Niñas, Niños y Adolescentes",
  "Procuraduría de Protección a Niñas, Niños y Adolescentes",
  "Otra Institución Gubernamental o Civil",
];

export const CanalizacionModal: React.FC<Props> = ({
  isOpen,
  currentUser,
  onClose,
  onSaved,
}) => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(true);

  // Search & Alumno Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);

  // Form Fields
  const [folio, setFolio] = useState(() => `CANAL-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [fechaCanalizacion, setFechaCanalizacion] = useState(() => new Date().toISOString().split("T")[0]);
  const [institucionDestino, setInstitucionDestino] = useState(INSTITUCIONES_DESTINO[0]);
  const [motivoCanalizacion, setMotivoCanalizacion] = useState("");
  const [estatus, setEstatus] = useState<EstatusCanalizacion>("PENDIENTE");
  const [tutorNotificado, setTutorNotificado] = useState(true);
  const [observaciones, setObservaciones] = useState("");

  // Feedback State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingAlumnos(true);
      const unsubscribe = subscribeAlumnos(
        (list) => {
          setAlumnos(list.filter((a) => a.estatus === "ACTIVO"));
          setLoadingAlumnos(false);
        },
        (err) => {
          console.error("Error subscribing to alumnos for canalizaciones:", err);
          setLoadingAlumnos(false);
        }
      );
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const searchResults = searchQuery.trim()
    ? alumnos.filter(
        (a) =>
          a.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.matricula.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAlumno) {
      setError("Debes buscar y seleccionar un alumno para registrar la canalización.");
      return;
    }

    if (!motivoCanalizacion.trim()) {
      setError("Por favor especifica el motivo o descripción de la canalización externa.");
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<CanalizacionExterna, "id"> = {
        folio,
        alumno_matricula: selectedAlumno.matricula,
        alumno_nombre: selectedAlumno.nombre_completo,
        grado_grupo: `${selectedAlumno.grado}° ${selectedAlumno.grupo}`,
        fecha_canalizacion: fechaCanalizacion,
        institucion_destino: institucionDestino,
        motivo_canalizacion: motivoCanalizacion,
        estatus,
        tutor_notificado: tutorNotificado,
        observaciones_seguimiento: observaciones,
        registrado_por_uid: currentUser.uid,
        registrado_por_nombre: currentUser.displayName || "Trabajo Social",
      };

      await addCanalizacion(payload);
      setSuccessMsg(`Canalización externa ${folio} registrada exitosamente en Firestore.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onSaved();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Error al guardar canalización:", err);
      setError("Ocurrió un error al guardar la canalización externa en Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Registro de Canalización Externa</h2>
              <p className="text-xs text-slate-300">
                Derivación institucional e interlocución de Trabajo Social con dependencias externas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Folio & Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Folio de Canalización
              </label>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Fecha de Canalización
              </label>
              <input
                type="date"
                value={fechaCanalizacion}
                onChange={(e) => setFechaCanalizacion(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Student Search & Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Buscar Alumno A Canalizar
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre o matrícula del alumno..."
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Dropdown results */}
            {searchResults.length > 0 && !selectedAlumno && (
              <div className="mt-1 border border-slate-200 rounded-xl bg-white shadow-lg max-h-44 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((al) => (
                  <div
                    key={al.matricula}
                    onClick={() => {
                      setSelectedAlumno(al);
                      setSearchQuery("");
                    }}
                    className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{al.nombre_completo}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Matrícula: {al.matricula}
                      </span>
                    </div>
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-200">
                      {al.grado}° {al.grupo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Alumno Card */}
          {selectedAlumno && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-800 tracking-wider block">
                  Alumno Asignado
                </span>
                <h4 className="text-xs font-black text-slate-900 mt-0.5">
                  {selectedAlumno.nombre_completo}
                </h4>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                  Matrícula: [{selectedAlumno.matricula}] | Grado y Grupo: {selectedAlumno.grado}° {selectedAlumno.grupo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlumno(null)}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          )}

          {/* Institution & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" /> Institución Externa Destino
              </label>
              <select
                value={institucionDestino}
                onChange={(e) => setInstitucionDestino(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
              >
                {INSTITUCIONES_DESTINO.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Estatus Inicial del Seguimiento
              </label>
              <select
                value={estatus}
                onChange={(e) => setEstatus(e.target.value as EstatusCanalizacion)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
              >
                <option value="PENDIENTE">PENDIENTE (Falta envío de oficio)</option>
                <option value="EN_PROCESO">EN PROCESO (Cita / Evaluación agendada)</option>
                <option value="ATENDIDO">ATENDIDO (En tratamiento / Asistencia)</option>
                <option value="FINALIZADO">FINALIZADO (Caso cerrado por institución)</option>
              </select>
            </div>
          </div>

          {/* Reason textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Motivo o Justificación de la Canalización
            </label>
            <textarea
              value={motivoCanalizacion}
              onChange={(e) => setMotivoCanalizacion(e.target.value)}
              rows={3}
              placeholder="Describe las situaciones académicas, familiares, conductuales o psicológicas que motivan la derivación..."
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          {/* Tutor Notified Checkbox */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center space-x-3">
            <input
              type="checkbox"
              id="tutorNotificado"
              checked={tutorNotificado}
              onChange={(e) => setTutorNotificado(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="tutorNotificado" className="text-xs text-slate-800 font-bold cursor-pointer">
              Tutor principal / Padre de familia fue notificado y firmó enterado del proceso de canalización.
            </label>
          </div>

          {/* Follow-up Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Observaciones de Seguimiento (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Número de expediente externo, nombre del contacto instituc., etc."
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !selectedAlumno}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{saving ? "Guardando en Firestore..." : "Guardar Canalización Externa"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
