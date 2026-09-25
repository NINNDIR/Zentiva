"use client";

import React, { useState, useEffect } from "react";
import { Alumno, UserProfile, RetardoRecord } from "@/lib/types";
import { subscribeAlumnos, addRetardo, addRetardosMasivos } from "@/lib/firestore-service";
import {
  X,
  Clock,
  CheckSquare,
  Square,
  Search,
  Users,
  User,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Filter,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onSaved: () => void;
}

const MOTIVOS_PREDEFINIDOS = [
  "Llegada fuera de horario de tolerancia",
  "Tráfico / Transporte público",
  "Causa médica / Cita hospitalaria",
  "Condiciones climáticas / Lluvia",
  "Sin justificación previa",
  "Otro (especificar en nota)",
];

export const RetardoModal: React.FC<Props> = ({
  isOpen,
  currentUser,
  onClose,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<"MASIVO" | "INDIVIDUAL">("MASIVO");
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(true);

  // Form common fields
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [hora, setHora] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  });
  const [motivo, setMotivo] = useState<string>(MOTIVOS_PREDEFINIDOS[0]);
  const [motivoDetalle, setMotivoDetalle] = useState<string>("");

  // Masivo State
  const [gradoFilter, setGradoFilter] = useState<number | "ALL">("ALL");
  const [grupoFilter, setGrupoFilter] = useState<string | "ALL">("ALL");
  const [selectedMatriculas, setSelectedMatriculas] = useState<Set<string>>(new Set());

  // Individual State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);

  // Feedback State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingAlumnos(true);
      const unsubscribe = subscribeAlumnos(
        (list) => {
          const activos = list.filter((a) => a.estatus === "ACTIVO");
          setAlumnos(activos);
          setLoadingAlumnos(false);
        },
        (err) => {
          console.error("Error subscribing to alumnos for retardos:", err);
          setLoadingAlumnos(false);
        }
      );
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter alumnos for Bulk tab
  const filteredAlumnosMasivo = alumnos.filter((a) => {
    const matchesGrado = gradoFilter === "ALL" || a.grado === gradoFilter;
    const matchesGrupo = grupoFilter === "ALL" || a.grupo === grupoFilter;
    return matchesGrado && matchesGrupo;
  });

  const allVisibleSelected =
    filteredAlumnosMasivo.length > 0 &&
    filteredAlumnosMasivo.every((a) => selectedMatriculas.has(a.matricula));

  const toggleSelectAllVisible = () => {
    const updated = new Set(selectedMatriculas);
    if (allVisibleSelected) {
      filteredAlumnosMasivo.forEach((a) => updated.delete(a.matricula));
    } else {
      filteredAlumnosMasivo.forEach((a) => updated.add(a.matricula));
    }
    setSelectedMatriculas(updated);
  };

  const toggleStudentSelection = (matricula: string) => {
    const updated = new Set(selectedMatriculas);
    if (updated.has(matricula)) {
      updated.delete(matricula);
    } else {
      updated.add(matricula);
    }
    setSelectedMatriculas(updated);
  };

  // Filter alumnos for Individual tab search dropdown
  const searchResultsIndividual = searchQuery.trim()
    ? alumnos.filter(
        (a) =>
          a.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.matricula.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSaveMasivo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedMatriculas.size === 0) {
      setError("Por favor selecciona al menos un alumno para registrar el retardo masivo.");
      return;
    }

    setSaving(true);
    try {
      const fechaHoraStr = `${fecha} ${hora}`;
      const motivoFinal = motivo === "Otro (especificar en nota)" && motivoDetalle ? motivoDetalle : motivo;

      const selectedAlumnosList = alumnos.filter((a) => selectedMatriculas.has(a.matricula));

      const payloadList: Omit<RetardoRecord, "id">[] = selectedAlumnosList.map((al) => ({
        alumno_matricula: al.matricula,
        alumno_nombre: al.nombre_completo,
        grado: al.grado,
        grupo: al.grupo,
        grado_grupo: `${al.grado}° ${al.grupo}`,
        fecha,
        hora,
        fecha_hora: fechaHoraStr,
        motivo: motivoFinal,
        es_masivo: true,
        registrado_por_uid: currentUser.uid,
        registrado_por_nombre: currentUser.displayName || "Prefectura / Trabajo Social",
      }));

      await addRetardosMasivos(payloadList);
      setSuccessMsg(`Se registraron ${payloadList.length} retardos masivos exitosamente.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onSaved();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Error al registrar retardos masivos:", err);
      setError("Ocurrió un error al guardar los retardos en Firestore.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAlumno) {
      setError("Por favor busca y selecciona un alumno para registrar su retardo.");
      return;
    }

    setSaving(true);
    try {
      const fechaHoraStr = `${fecha} ${hora}`;
      const motivoFinal = motivo === "Otro (especificar en nota)" && motivoDetalle ? motivoDetalle : motivo;

      const payload: Omit<RetardoRecord, "id"> = {
        alumno_matricula: selectedAlumno.matricula,
        alumno_nombre: selectedAlumno.nombre_completo,
        grado: selectedAlumno.grado,
        grupo: selectedAlumno.grupo,
        grado_grupo: `${selectedAlumno.grado}° ${selectedAlumno.grupo}`,
        fecha,
        hora,
        fecha_hora: fechaHoraStr,
        motivo: motivoFinal,
        es_masivo: false,
        registrado_por_uid: currentUser.uid,
        registrado_por_nombre: currentUser.displayName || "Prefectura / Trabajo Social",
      };

      await addRetardo(payload);
      setSuccessMsg(`Retardo para ${selectedAlumno.nombre_completo} registrado exitosamente.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onSaved();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Error al registrar retardo individual:", err);
      setError("Ocurrió un error al guardar el retardo en Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Registro de Retardos de Asistencia</h2>
              <p className="text-xs text-slate-300">
                Módulo oficial de control de retardos ligero para expediente y timeline.
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 space-x-2">
          <button
            onClick={() => {
              setActiveTab("MASIVO");
              setError(null);
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === "MASIVO"
                ? "bg-white text-blue-700 border-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 border-transparent"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Retardos Masivos (Lotes por Grupo)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("INDIVIDUAL");
              setError(null);
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === "INDIVIDUAL"
                ? "bg-white text-blue-700 border-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 border-transparent"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Retardo Individual</span>
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

        {/* Shared Date/Time/Reason Section */}
        <div className="p-6 pb-2 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 border-b border-slate-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Fecha del Evento
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Hora de Retardo
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Motivo General de Retardo
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
            >
              {MOTIVOS_PREDEFINIDOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {motivo === "Otro (especificar en nota)" && (
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Especificar Motivo Personalizado
              </label>
              <input
                type="text"
                value={motivoDetalle}
                onChange={(e) => setMotivoDetalle(e.target.value)}
                placeholder="Escribe la especificación del retardo..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}
        </div>

        {/* TAB 1: RETARDOS MASIVOS (POR LOTES) */}
        {activeTab === "MASIVO" && (
          <form onSubmit={handleSaveMasivo} className="p-6 space-y-4">
            
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Filtrar por Grupo:</span>
                
                <select
                  value={gradoFilter}
                  onChange={(e) =>
                    setGradoFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
                  }
                  className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                >
                  <option value="ALL">Todos los Grados</option>
                  <option value={1}>1° Grado</option>
                  <option value={2}>2° Grado</option>
                  <option value={3}>3° Grado</option>
                </select>

                <select
                  value={grupoFilter}
                  onChange={(e) => setGrupoFilter(e.target.value)}
                  className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                >
                  <option value="ALL">Todos los Grupos</option>
                  {["A", "B", "C", "D", "E", "F", "G"].map((g) => (
                    <option key={g} value={g}>
                      Grupo {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                {selectedMatriculas.size} alumnos seleccionados
              </div>
            </div>

            {/* Selection Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-72 overflow-y-auto">
              {loadingAlumnos ? (
                <div className="p-8 text-center text-xs text-slate-500">Cargando alumnos de Firestore...</div>
              ) : filteredAlumnosMasivo.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-medium">
                  No se encontraron alumnos activos en el grupo seleccionado.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAllVisible}
                          className="text-slate-600 hover:text-blue-600 transition cursor-pointer"
                          title="Seleccionar / Deseleccionar todos los visibles"
                        >
                          {allVisibleSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 mx-auto" />
                          ) : (
                            <Square className="w-4 h-4 mx-auto text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-4">Alumno(a)</th>
                      <th className="py-2.5 px-4">Matrícula</th>
                      <th className="py-2.5 px-4 text-center">Grado y Grupo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAlumnosMasivo.map((al) => {
                      const isSelected = selectedMatriculas.has(al.matricula);
                      return (
                        <tr
                          key={al.matricula}
                          onClick={() => toggleStudentSelection(al.matricula)}
                          className={`cursor-pointer transition select-none ${
                            isSelected ? "bg-blue-50/80 hover:bg-blue-100/80" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 mx-auto" />
                            ) : (
                              <Square className="w-4 h-4 mx-auto text-slate-300" />
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {al.nombre_completo}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                            {al.matricula}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">
                            {al.grado}° {al.grupo}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || selectedMatriculas.size === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>
                  {saving
                    ? "Guardando Lote en Firestore..."
                    : `Registrar Retardos Masivos (${selectedMatriculas.size})`}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: RETARDO INDIVIDUAL */}
        {activeTab === "INDIVIDUAL" && (
          <form onSubmit={handleSaveIndividual} className="p-6 space-y-4">
            
            {/* Student Search */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Buscar Alumno por Nombre o Matrícula
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Escribe para buscar..."
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Search dropdown results */}
              {searchResultsIndividual.length > 0 && !selectedAlumno && (
                <div className="mt-1 border border-slate-200 rounded-xl bg-white shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {searchResultsIndividual.map((al) => (
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

            {/* Selected Alumno Display Card */}
            {selectedAlumno && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider block">
                    Alumno Seleccionado
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedAlumno.nombre_completo}
                  </h4>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
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
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>{saving ? "Guardando en Firestore..." : "Registrar Retardo Individual"}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
