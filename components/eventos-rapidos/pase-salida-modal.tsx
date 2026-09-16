"use client";

import React, { useState, useEffect } from "react";
import { Alumno, UserProfile, EventoRapido } from "@/lib/types";
import { getAlumnos, addEventoRapido } from "@/lib/firestore-service";
import { LogOut, X, ShieldAlert, CheckSquare, Search, FileText } from "lucide-react";

interface PaseSalidaModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onSaved: () => void;
}

export const PaseSalidaModal: React.FC<PaseSalidaModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaved,
}) => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [selectedMatricula, setSelectedMatricula] = useState("");
  const [quienRetiraNombre, setQuienRetiraNombre] = useState("");
  const [quienRetiraParentesco, setQuienRetiraParentesco] = useState("Madre");
  const [medioAutorizacion, setMedioAutorizacion] = useState("Presencial con INE física");
  const [ineFolio, setIneFolio] = useState("");
  const [motivo, setMotivo] = useState("");
  const [ineFisicaResguardada, setIneFisicaResguardada] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      getAlumnos().then(setAlumnos).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedAlumno = alumnos.find((a) => a.matricula === selectedMatricula);

  // Auto-fill tutor details if available from alumno contacts
  const handleSelectAlumno = (matr: string) => {
    setSelectedMatricula(matr);
    const al = alumnos.find((a) => a.matricula === matr);
    if (al && al.contactos_oficiales && al.contactos_oficiales.length > 0) {
      const tutor = al.contactos_oficiales.find((c) => c.es_tutor_legal) || al.contactos_oficiales[0];
      setQuienRetiraNombre(tutor.nombre);
      setQuienRetiraParentesco(tutor.parentesco);
      if (tutor.ine_folio) setIneFolio(tutor.ine_folio);
    }
  };

  const filteredAlumnos = alumnos.filter(
    (a) =>
      a.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.matricula.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumno) {
      alert("Por favor selecciona un alumno.");
      return;
    }

    if (!ineFisicaResguardada) {
      alert("Es obligatorio confirmar la validación e inhabilitación física de la INE.");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const fechaHoraStr = now.toISOString().split("T")[0] + " " + now.toTimeString().slice(0, 5);

      await addEventoRapido({
        tipo: "PASE_SALIDA",
        alumno_matricula: selectedAlumno.matricula,
        alumno_nombre: selectedAlumno.nombre_completo,
        grado_grupo: `${selectedAlumno.grado}° ${selectedAlumno.grupo}`,
        fecha_hora: fechaHoraStr,
        quien_retira_nombre: quienRetiraNombre.toUpperCase().trim(),
        quien_retira_parentesco: quienRetiraParentesco,
        medio_autorizacion: medioAutorizacion,
        ine_folio: ineFolio.trim(),
        ine_fisica_resguardada: ineFisicaResguardada,
        motivo: motivo.trim(),
        registrado_por: currentUser.displayName,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error("Error al registrar pase de salida:", err);
      alert("Ocurrió un error al guardar el pase de salida.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LogOut className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm tracking-wide">REGISTRO DE PASE DE SALIDA / RETIRO EXTRAORDINARIO</h3>
              <p className="text-[11px] text-slate-400">Validación de tutela y resguardo físico oficial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Alumno Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase block">1. Seleccionar Alumno(a)</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o matrícula..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            <select
              value={selectedMatricula}
              onChange={(e) => handleSelectAlumno(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono"
            >
              <option value="">-- Selecciona alumno de la lista ({filteredAlumnos.length}) --</option>
              {filteredAlumnos.map((a) => (
                <option key={a.matricula} value={a.matricula}>
                  [{a.matricula}] - {a.nombre_completo} ({a.grado}° {a.grupo})
                </option>
              ))}
            </select>
          </div>

          {selectedAlumno && (
            <div className="bg-cyan-50/60 border border-cyan-200 rounded-lg p-3 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-cyan-900 block">{selectedAlumno.nombre_completo}</span>
                <span className="text-slate-600">Matrícula: {selectedAlumno.matricula} | Grado: {selectedAlumno.grado}° {selectedAlumno.grupo}</span>
              </div>
              <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 font-bold rounded text-[10px]">
                {selectedAlumno.turno}
              </span>
            </div>
          )}

          {/* Step 2: Quien retira */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nombre Completo de quien Retira</label>
              <input
                type="text"
                value={quienRetiraNombre}
                onChange={(e) => setQuienRetiraNombre(e.target.value)}
                required
                placeholder="Ej. MARÍA CRUZ FUENTES"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Parentesco / Relación</label>
              <select
                value={quienRetiraParentesco}
                onChange={(e) => setQuienRetiraParentesco(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Tutor Legal">Tutor Legal</option>
                <option value="Abuela/o">Abuela/o</option>
                <option value="Tío/a">Tío/a</option>
                <option value="Familiar Autorizado">Familiar Autorizado</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Step 3: Authorization method & INE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Medio de Autorización</label>
              <select
                value={medioAutorizacion}
                onChange={(e) => setMedioAutorizacion(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Presencial con INE física">Presencial con INE física</option>
                <option value="Validación Telefónica con Tutor Legal">Validación Telefónica con Tutor Legal</option>
                <option value="Citatorio Médico Previsto">Citatorio Médico Previsto</option>
                <option value="Autorización Escrita Firmada">Autorización Escrita Firmada</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Folio de INE / Identificación</label>
              <input
                type="text"
                value={ineFolio}
                onChange={(e) => setIneFolio(e.target.value)}
                placeholder="Ej. IDMEX1234567890"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Step 4: Motivo */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Motivo del Retiro</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              placeholder="Ej. Cita médica en IMSS / Malestar físico de la alumna"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          {/* Mandatory INE Verification Checkbox */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-2">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="ine_checkbox"
                checked={ineFisicaResguardada}
                onChange={(e) => setIneFisicaResguardada(e.target.checked)}
                className="mt-0.5 h-4 h-4 text-cyan-600 rounded border-amber-400 focus:ring-cyan-500 cursor-pointer"
              />
              <label htmlFor="ine_checkbox" className="text-xs font-bold text-amber-950 cursor-pointer leading-relaxed">
                [x] Confirmo que se realizó validación telefónica y se resguardó la copia física de la INE en el expediente impreso.
              </label>
            </div>
            <p className="text-[11px] text-amber-800 pl-7">
              ⚠️ Norma de Seguridad Escolar: Antigravity Zentiva NO almacena imágenes ni fotografías de documentos oficiales. La copia física debe archivarse en el expediente de la Trabajadora Social.
            </p>
          </div>

          {/* Registered by */}
          <div className="text-right text-[11px] text-slate-500">
            Registrado por: <span className="font-semibold text-slate-700">{currentUser.displayName} ({currentUser.cargo})</span>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !ineFisicaResguardada || !selectedAlumno}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>{submitting ? "Generando Pase..." : "Emitir Pase de Salida"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
