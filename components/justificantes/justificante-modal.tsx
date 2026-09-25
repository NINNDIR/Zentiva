"use client";

import React, { useState, useEffect } from "react";
import { Alumno, UserProfile, JustificanteMedico } from "@/lib/types";
import { subscribeAlumnos, addJustificante } from "@/lib/firestore-service";
import {
  X,
  FileCheck,
  Search,
  Calendar,
  Building2,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onSaved: () => void;
}

const INSTITUCIONES_MEDICAS = [
  "IMSS - Instituto Mexicano del Seguro Social",
  "ISSSTE - Inst. de Seguridad y Serv. Soc. de los Trab. del Estado",
  "Centro de Salud Urbano / Secretaría de Salud",
  "Cruz Roja Mexicana",
  "Clínica / Sanatorio Particular",
  "Otra Institución Médica",
];

const MOTIVOS_MEDICOS_COMUNES = [
  "Infección Respiratoria Aguda / Cuadro Gripal",
  "Infección Gastrointestinal / Gastroenteritis",
  "Reposos por Lesión Traumatológica / Físico",
  "Estudios Médicos / Cita Especializada",
  "Tratamiento Odontológico",
  "Aislamiento / Condición Infectocontagiosa",
  "Otro Motivo Médico",
];

export const JustificanteModal: React.FC<Props> = ({
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
  const [folio, setFolio] = useState(() => `JUST-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [fechaEmision, setFechaEmision] = useState(() => new Date().toISOString().split("T")[0]);
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split("T")[0]);
  const [motivoMedico, setMotivoMedico] = useState(MOTIVOS_MEDICOS_COMUNES[0]);
  const [motivoDetalle, setMotivoDetalle] = useState("");
  const [institucionMedica, setInstitucionMedica] = useState(INSTITUCIONES_MEDICAS[0]);
  const [medicoNombre, setMedicoNombre] = useState("");
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
          console.error("Error subscribing to alumnos for justificantes:", err);
          setLoadingAlumnos(false);
        }
      );
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate dynamic days of absence
  const calcularDiasTotales = () => {
    if (!fechaInicio || !fechaFin) return 1;
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const diasTotales = calcularDiasTotales();

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
      setError("Debes buscar y seleccionar a un alumno para expedir el justificante.");
      return;
    }

    if (diasTotales <= 0) {
      setError("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
      return;
    }

    setSaving(true);
    try {
      const motivoFinal =
        motivoMedico === "Otro Motivo Médico" && motivoDetalle ? motivoDetalle : motivoMedico;

      const payload: Omit<JustificanteMedico, "id"> = {
        folio,
        alumno_matricula: selectedAlumno.matricula,
        alumno_nombre: selectedAlumno.nombre_completo,
        grado_grupo: `${selectedAlumno.grado}° ${selectedAlumno.grupo}`,
        fecha_emision: fechaEmision,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        dias_totales: diasTotales,
        motivo_medico: motivoFinal,
        institucion_medica: institucionMedica,
        medico_nombre: medicoNombre,
        observaciones,
        registrado_por_uid: currentUser.uid,
        registrado_por_nombre: currentUser.displayName || "Trabajo Social",
      };

      await addJustificante(payload);
      setSuccessMsg(`Justificante médico ${folio} guardado exitosamente en Firestore.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onSaved();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Error al guardar justificante:", err);
      setError("Ocurrió un error al guardar el justificante médico en Firestore.");
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Registro de Justificante Médico</h2>
              <p className="text-xs text-slate-300">
                Resguardo oficial de inasistencias por salud asociadas al expediente escolar.
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
          
          {/* Folio & Fecha Emisión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Folio de Justificante
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
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Fecha de Emisión / Registro
              </label>
              <input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Student Search & Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Buscar Alumno Involucrado
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
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
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

          {/* Rango de Días de Ausencia */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" /> Rango de Inasistencia Médica
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Fecha Inicio Ausencia
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Fecha Fin Ausencia
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Días Totales Calculados
                </label>
                <div className="w-full text-xs p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl font-bold font-mono text-emerald-900 text-center flex items-center justify-center">
                  {diasTotales} {diasTotales === 1 ? "día" : "días"} justificados
                </div>
              </div>
            </div>
          </div>

          {/* Medical Reason & Institution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-slate-500" /> Motivo Médico Principal
              </label>
              <select
                value={motivoMedico}
                onChange={(e) => setMotivoMedico(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
              >
                {MOTIVOS_MEDICOS_COMUNES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" /> Institución Médica / Expedidor
              </label>
              <select
                value={institucionMedica}
                onChange={(e) => setInstitucionMedica(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
              >
                {INSTITUCIONES_MEDICAS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {motivoMedico === "Otro Motivo Médico" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Especificar Diagnóstico / Motivo
              </label>
              <input
                type="text"
                value={motivoDetalle}
                onChange={(e) => setMotivoDetalle(e.target.value)}
                placeholder="Detalle médico relevante..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          {/* Physician Name & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombre del Médico Tratante (Opcional)
              </label>
              <input
                type="text"
                value={medicoNombre}
                onChange={(e) => setMedicoNombre(e.target.value)}
                placeholder="Dr(a). Nombre Completo y/o Cédula"
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Observaciones Adicionales
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles sobre presentación de receta o copia..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
              />
            </div>
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{saving ? "Guardando en Firestore..." : "Guardar Justificante Médico"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
