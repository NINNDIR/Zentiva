"use client";

import React, { useState, useEffect } from "react";
import { Alumno, UserProfile, ContactoOficial } from "@/lib/types";
import { subscribeAlumnos, addSalidaExtraordinaria } from "@/lib/firestore-service";
import {
  LogOut,
  X,
  ShieldAlert,
  Search,
  FileText,
  UserCheck,
  UserPlus,
  PhoneCall,
  IdCard,
  CheckCircle2,
  AlertTriangle,
  Users,
} from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");

  // Visitor Selection State
  const [tipoVisitante, setTipoVisitante] = useState<"CONTACTO_REGISTRADO" | "CUARTO_VISITANTE">("CONTACTO_REGISTRADO");
  const [selectedContactoId, setSelectedContactoId] = useState<string>("");

  // Visitor Details State
  const [quienRetiraNombre, setQuienRetiraNombre] = useState("");
  const [quienRetiraParentesco, setQuienRetiraParentesco] = useState("Madre");
  const [ineFolio, setIneFolio] = useState("");

  // Other Details
  const [medioAutorizacion, setMedioAutorizacion] = useState("Validación Telefónica y Presencial con INE en Físico");
  const [motivo, setMotivo] = useState("");
  const [validacionIneFisicaConfirmada, setValidacionIneFisicaConfirmada] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeAlumnos((list) => {
        setAlumnos(list);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedAlumno = alumnos.find((a) => a.matricula === selectedMatricula);

  // Auto-fill form when student or contact option is selected
  const handleSelectAlumno = (matr: string) => {
    setSelectedMatricula(matr);
    const al = alumnos.find((a) => a.matricula === matr);

    if (al && al.contactos_oficiales && al.contactos_oficiales.length > 0) {
      const tutor = al.contactos_oficiales.find((c) => c.es_tutor_legal) || al.contactos_oficiales[0];
      setTipoVisitante("CONTACTO_REGISTRADO");
      setSelectedContactoId(tutor.id || `c-${tutor.prioridad}`);
      setQuienRetiraNombre(tutor.nombre);
      setQuienRetiraParentesco(tutor.parentesco);
      setIneFolio(tutor.ine_folio || "");
    } else {
      setTipoVisitante("CUARTO_VISITANTE");
      setSelectedContactoId("");
      setQuienRetiraNombre("");
      setQuienRetiraParentesco("Familiar Autorizado");
      setIneFolio("");
    }
  };

  const handleSelectContacto = (contacto: ContactoOficial) => {
    setTipoVisitante("CONTACTO_REGISTRADO");
    setSelectedContactoId(contacto.id || `c-${contacto.prioridad}`);
    setQuienRetiraNombre(contacto.nombre);
    setQuienRetiraParentesco(contacto.parentesco);
    setIneFolio(contacto.ine_folio || "");
  };

  const handleSelectCuartoVisitante = () => {
    setTipoVisitante("CUARTO_VISITANTE");
    setSelectedContactoId("cuarto_visitante");
    setQuienRetiraNombre("");
    setQuienRetiraParentesco("Familiar Autorizado");
    setIneFolio("");
  };

  const filteredAlumnos = alumnos.filter(
    (a) =>
      a.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.matricula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.curp.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumno) {
      alert("Por favor selecciona un alumno.");
      return;
    }

    if (!quienRetiraNombre.trim()) {
      alert("Por favor ingresa el nombre de la persona que retira al menor.");
      return;
    }

    if (tipoVisitante === "CUARTO_VISITANTE" && (!quienRetiraNombre.trim() || !quienRetiraParentesco.trim() || !ineFolio.trim())) {
      alert("Para registrar a un Cuarto Visitante es obligatorio capturar Nombre Completo, Parentesco y Folio de INE.");
      return;
    }

    if (!validacionIneFisicaConfirmada) {
      alert("Es obligatorio confirmar la validación telefónica y el resguardo de la copia física de la INE.");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const fechaHoraStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      await addSalidaExtraordinaria({
        alumno_matricula: selectedAlumno.matricula,
        alumno_nombre: selectedAlumno.nombre_completo,
        grado_grupo: `${selectedAlumno.grado}° "${selectedAlumno.grupo}"`,
        fecha_hora: fechaHoraStr,
        tipo_visitante: tipoVisitante,
        contacto_oficial_id: tipoVisitante === "CONTACTO_REGISTRADO" ? selectedContactoId : undefined,
        quien_retira_nombre: quienRetiraNombre.toUpperCase().trim(),
        quien_retira_parentesco: quienRetiraParentesco.trim(),
        ine_folio: ineFolio.toUpperCase().trim(),
        medio_autorizacion: medioAutorizacion,
        motivo: motivo.trim(),
        validacion_ine_fisica_confirmada: validacionIneFisicaConfirmada,
        registrado_por_uid: currentUser.uid,
        registrado_por_nombre: currentUser.displayName,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error("Error al registrar salida extraordinaria:", err);
      alert("Ocurrió un error al guardar la salida extraordinaria en Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] text-sm">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-xl text-white shadow-sm">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                <span>MÓDULO DE SALIDA EXTRAORDINARIA DE MENOR</span>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-400/30">
                  FIRESTORE EN VIVO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Protocolo oficial de retiro escolar con validación de tutela y resguardo de INE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Step 1: Buscador y Selección de Alumno */}
          <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <label className="text-xs font-bold text-cyan-900 font-mono uppercase block flex items-center gap-1.5">
              <Search className="w-4 h-4 text-cyan-600" />
              1. BUSCAR Y SELECCIONAR ALUMNO(A)
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre completo, CURP o matrícula..."
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none font-medium"
              />
            </div>

            <select
              value={selectedMatricula}
              onChange={(e) => handleSelectAlumno(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono font-bold text-slate-900"
            >
              <option value="">-- Seleccionar alumno de la lista ({filteredAlumnos.length}) --</option>
              {filteredAlumnos.map((a) => (
                <option key={a.matricula} value={a.matricula}>
                  [{a.matricula}] - {a.nombre_completo} ({a.grado}° "{a.grupo}" • {a.turno})
                </option>
              ))}
            </select>

            {selectedAlumno && (
              <div className="bg-white border border-cyan-300 rounded-xl p-3.5 flex justify-between items-center shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{selectedAlumno.nombre_completo}</span>
                    <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 bg-slate-900 text-cyan-300 rounded">
                      {selectedAlumno.matricula}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    CURP: <strong>{selectedAlumno.curp}</strong> • Grado: <strong>{selectedAlumno.grado}° "{selectedAlumno.grupo}"</strong> ({selectedAlumno.turno})
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-xs">
                  {selectedAlumno.estatus}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Auto-Carga de 3 Contactos Oficiales o Cuarto Visitante */}
          {selectedAlumno && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <label className="text-xs font-bold text-cyan-900 font-mono uppercase flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-600" />
                  2. PERSONA QUE SE PRESENTA A RETIRAR AL MENOR
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Selecciona uno de los 3 contactos o registra un Cuarto Visitante</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 3 Registered Contacts Cards */}
                {selectedAlumno.contactos_oficiales && selectedAlumno.contactos_oficiales.length > 0 ? (
                  selectedAlumno.contactos_oficiales.map((c) => {
                    const cId = c.id || `c-${c.prioridad}`;
                    const isSelected = tipoVisitante === "CONTACTO_REGISTRADO" && selectedContactoId === cId;
                    return (
                      <div
                        key={cId}
                        onClick={() => handleSelectContacto(c)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? "bg-cyan-50 border-cyan-500 shadow-md ring-2 ring-cyan-400/30"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="visitante_option"
                              checked={isSelected}
                              onChange={() => handleSelectContacto(c)}
                              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                            />
                            <span className="text-[10px] font-extrabold font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-100">
                              {c.prioridad === 1 ? "1. TUTOR LEGAL" : `CONTACTO ${c.prioridad}`}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-600">{c.parentesco}</span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">{c.nombre}</h4>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Tel: <strong className="text-slate-800">{c.telefono || "Sin registrar"}</strong>
                            {c.ine_folio ? ` | INE: ${c.ine_folio}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                    El alumno no cuenta con contactos oficiales registrados. Procede a registrar como Cuarto Visitante.
                  </div>
                )}

                {/* Option 4: Cuarto Visitante (Persona Ajena) */}
                <div
                  onClick={handleSelectCuartoVisitante}
                  className={`col-span-1 md:col-span-2 p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    tipoVisitante === "CUARTO_VISITANTE"
                      ? "bg-purple-50 border-purple-500 shadow-md ring-2 ring-purple-400/30"
                      : "bg-slate-50 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="visitante_option"
                      checked={tipoVisitante === "CUARTO_VISITANTE"}
                      onChange={handleSelectCuartoVisitante}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-extrabold text-purple-950 text-xs flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-purple-600" />
                        PERSONA AJENA A LOS 3 CONTACTOS OFICIALES (REGISTRAR CUARTO VISITANTE)
                      </span>
                      <p className="text-[11px] text-purple-800">
                        Selecciona esta opción si se presenta un familiar o tercero no registrado en la tutela escolar.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg border border-purple-200">
                    Formulario Extra
                  </span>
                </div>
              </div>

              {/* Form Section for Cuarto Visitante if selected */}
              {tipoVisitante === "CUARTO_VISITANTE" && (
                <div className="p-4 bg-purple-50/70 border border-purple-300 rounded-xl space-y-4 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-950 font-mono border-b border-purple-200 pb-2">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>REGISTRO OBLIGATORIO DE CUARTO VISITANTE (PERSONA AJENA)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Nombre Completo del Visitante *
                      </label>
                      <input
                        type="text"
                        required={tipoVisitante === "CUARTO_VISITANTE"}
                        value={quienRetiraNombre}
                        onChange={(e) => setQuienRetiraNombre(e.target.value)}
                        placeholder="ej. CARLOS SANCHEZ GOMEZ"
                        className="w-full text-xs p-2.5 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Parentesco / Relación con Alumno *
                      </label>
                      <input
                        type="text"
                        required={tipoVisitante === "CUARTO_VISITANTE"}
                        value={quienRetiraParentesco}
                        onChange={(e) => setQuienRetiraParentesco(e.target.value)}
                        placeholder="ej. Tío Materno / Padrino / Vecino de Confianza"
                        className="w-full text-xs p-2.5 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Folio de INE / Identificación *
                      </label>
                      <input
                        type="text"
                        required={tipoVisitante === "CUARTO_VISITANTE"}
                        value={ineFolio}
                        onChange={(e) => setIneFolio(e.target.value)}
                        placeholder="ej. IDMEX9876543210"
                        className="w-full text-xs p-2.5 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono font-bold uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Authorization Method & Motivo */}
          {selectedAlumno && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Medio de Autorización</label>
                  <select
                    value={medioAutorizacion}
                    onChange={(e) => setMedioAutorizacion(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-medium"
                  >
                    <option value="Validación Telefónica y Presencial con INE en Físico">
                      Validación Telefónica y Presencial con INE en Físico
                    </option>
                    <option value="Validación Telefónica Directa con Tutor Legal Principal">
                      Validación Telefónica Directa con Tutor Legal Principal
                    </option>
                    <option value="Citatorio Médico Previsto / Pase Sanitario">
                      Citatorio Médico Previsto / Pase Sanitario
                    </option>
                    <option value="Autorización Escrita Firmada con Copia INE">
                      Autorización Escrita Firmada con Copia INE
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Folio de INE / Identificación</label>
                  <input
                    type="text"
                    value={ineFolio}
                    onChange={(e) => setIneFolio(e.target.value)}
                    required
                    placeholder="ej. IDMEX1234567890"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Motivo del Retiro Extraordinario *</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  placeholder="ej. Cita médica en IMSS / Malestar físico presentado durante horario escolar"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none font-medium"
                />
              </div>

              {/* Mandatory Legal Checkbox specified by User */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="ine_legal_confirm_checkbox"
                    required
                    checked={validacionIneFisicaConfirmada}
                    onChange={(e) => setValidacionIneFisicaConfirmada(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-cyan-600 rounded border-amber-400 focus:ring-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="ine_legal_confirm_checkbox" className="text-xs font-bold text-amber-950 cursor-pointer leading-relaxed">
                    [x] Confirmo que se realizó validación telefónica y se resguardó la copia física de la INE en el expediente impreso.
                  </label>
                </div>
                <p className="text-[11px] text-amber-900 font-semibold pl-7">
                  ⚠️ Norma de Seguridad Escolar: Zentiva NO almacena imágenes ni fotografías de documentos oficiales. La copia física de la INE debe archivarse en el expediente físico del alumno en Trabajo Social.
                </p>
              </div>

              <div className="text-right text-[11px] text-slate-500 font-mono">
                Registrado por: <strong className="text-slate-800">{currentUser.displayName} ({currentUser.cargo})</strong>
              </div>
            </div>
          )}
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
            disabled={submitting || !validacionIneFisicaConfirmada || !selectedAlumno}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow transition disabled:opacity-50 flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>{submitting ? "Guardando en Firestore..." : "Emitir Pase y Registrar en Firestore"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
