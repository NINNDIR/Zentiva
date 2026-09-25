"use client";

import React, { useState, useEffect } from "react";
import { Alumno, ContactoOficial, generarMatriculaPorGrado, calcularEdad } from "@/lib/types";
import { saveAlumno } from "@/lib/firestore-service";
import { ColoniaSelect } from "./colonia-select";
import { X, UserPlus, Save, ShieldCheck, Phone, IdCard, Home, Briefcase } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialAlumno?: Alumno | null;
}

export const AlumnoModalForm: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaved,
  initialAlumno,
}) => {
  const [saving, setSaving] = useState(false);

  // Form State
  const [matricula, setMatricula] = useState("");
  const [curp, setCurp] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [grado, setGrado] = useState<1 | 2 | 3>(1);
  const [grupo, setGrupo] = useState<"A" | "B" | "C" | "D" | "E" | "F" | "G">("A");
  const [noLista, setNoLista] = useState(1);
  const [turno, setTurno] = useState<"MATUTINO" | "VESPERTINO">("MATUTINO");
  const [fechaNacimiento, setFechaNacimiento] = useState("2014-05-10");
  const [sexo, setSexo] = useState<"M" | "F">("M");
  
  // Address & Colonia
  const [calleNumero, setCalleNumero] = useState("");
  const [coloniaStr, setColoniaStr] = useState("FELIPE CARRILLO PUERTO");
  const [coloniaId, setColoniaId] = useState("");
  const [coloniaOtro, setColoniaOtro] = useState(false);
  const [coloniaPendiente, setColoniaPendiente] = useState(false);

  // Contact 1
  const [t1Nombre, setT1Nombre] = useState("");
  const [t1Parentesco, setT1Parentesco] = useState("Madre");
  const [t1Telefono, setT1Telefono] = useState("");
  const [t1Trabajo, setT1Trabajo] = useState("");
  const [t1TelTrabajo, setT1TelTrabajo] = useState("");
  const [t1Ine, setT1Ine] = useState("");

  // Contact 2
  const [t2Nombre, setT2Nombre] = useState("");
  const [t2Parentesco, setT2Parentesco] = useState("Padre");
  const [t2Telefono, setT2Telefono] = useState("");
  const [t2Trabajo, setT2Trabajo] = useState("");
  const [t2TelTrabajo, setT2TelTrabajo] = useState("");

  // Contact 3
  const [t3Nombre, setT3Nombre] = useState("");
  const [t3Parentesco, setT3Parentesco] = useState("Tío/a");
  const [t3Telefono, setT3Telefono] = useState("");
  const [t3Trabajo, setT3Trabajo] = useState("");
  const [t3TelTrabajo, setT3TelTrabajo] = useState("");

  useEffect(() => {
    if (initialAlumno) {
      setMatricula(initialAlumno.matricula);
      setCurp(initialAlumno.curp);
      setNombreCompleto(initialAlumno.nombre_completo);
      setGrado(initialAlumno.grado);
      setGrupo(initialAlumno.grupo);
      setNoLista(initialAlumno.no_lista);
      setTurno(initialAlumno.turno);
      setFechaNacimiento(initialAlumno.fecha_nacimiento);
      setSexo(initialAlumno.sexo);
      setCalleNumero(initialAlumno.domicilio.calle_numero);
      setColoniaStr(initialAlumno.domicilio.colonia);
      setColoniaId(initialAlumno.domicilio.colonia_id || "");
      setColoniaOtro(!!initialAlumno.domicilio.colonia_otro);
      setColoniaPendiente(!!initialAlumno.domicilio.colonia_pendiente_revision);

      const c1 = initialAlumno.contactos_oficiales.find((c) => c.prioridad === 1);
      if (c1) {
        setT1Nombre(c1.nombre);
        setT1Parentesco(c1.parentesco);
        setT1Telefono(c1.telefono);
        setT1Trabajo(c1.lugar_trabajo || "");
        setT1TelTrabajo(c1.telefono_trabajo || "");
        setT1Ine(c1.ine_folio || "");
      }

      const c2 = initialAlumno.contactos_oficiales.find((c) => c.prioridad === 2);
      if (c2) {
        setT2Nombre(c2.nombre);
        setT2Parentesco(c2.parentesco);
        setT2Telefono(c2.telefono);
        setT2Trabajo(c2.lugar_trabajo || "");
        setT2TelTrabajo(c2.telefono_trabajo || "");
      }

      const c3 = initialAlumno.contactos_oficiales.find((c) => c.prioridad === 3);
      if (c3) {
        setT3Nombre(c3.nombre);
        setT3Parentesco(c3.parentesco);
        setT3Telefono(c3.telefono);
        setT3Trabajo(c3.lugar_trabajo || "");
        setT3TelTrabajo(c3.telefono_trabajo || "");
      }
    } else {
      updateMatriculaForGrado(1);
      setColoniaOtro(false);
      setColoniaPendiente(false);
      setColoniaId("");
    }
  }, [isOpen, initialAlumno]);

  const updateMatriculaForGrado = (g: 1 | 2 | 3) => {
    if (initialAlumno) return;
    const randNum = Math.floor(Math.random() * 80) + 10;
    setMatricula(generarMatriculaPorGrado(g, randNum));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto || !t1Nombre || !t1Telefono) {
      alert("Por favor completa los campos obligatorios (Nombre Completo del Alumno y Tutor Legal).");
      return;
    }

    setSaving(true);
    const normColonia = coloniaStr.toUpperCase().trim();

    const contactos: ContactoOficial[] = [
      {
        id: "c1",
        prioridad: 1,
        es_tutor_legal: true,
        nombre: t1Nombre.toUpperCase(),
        parentesco: t1Parentesco,
        telefono: t1Telefono,
        lugar_trabajo: t1Trabajo ? t1Trabajo.toUpperCase() : undefined,
        telefono_trabajo: t1TelTrabajo || undefined,
        ine_folio: t1Ine ? t1Ine.toUpperCase() : undefined,
      },
    ];

    if (t2Nombre.trim()) {
      contactos.push({
        id: "c2",
        prioridad: 2,
        es_tutor_legal: false,
        nombre: t2Nombre.toUpperCase(),
        parentesco: t2Parentesco,
        telefono: t2Telefono,
        lugar_trabajo: t2Trabajo ? t2Trabajo.toUpperCase() : undefined,
        telefono_trabajo: t2TelTrabajo || undefined,
      });
    }

    if (t3Nombre.trim()) {
      contactos.push({
        id: "c3",
        prioridad: 3,
        es_tutor_legal: false,
        nombre: t3Nombre.toUpperCase(),
        parentesco: t3Parentesco,
        telefono: t3Telefono,
        lugar_trabajo: t3Trabajo ? t3Trabajo.toUpperCase() : undefined,
        telefono_trabajo: t3TelTrabajo || undefined,
      });
    }

    const alumnoData: Alumno = {
      matricula,
      curp: curp.toUpperCase(),
      nombre_completo: nombreCompleto.toUpperCase(),
      grado,
      grupo,
      no_lista: Number(noLista),
      turno,
      fecha_nacimiento: fechaNacimiento,
      sexo,
      domicilio: {
        calle_numero: calleNumero.toUpperCase(),
        colonia: normColonia || "FELIPE CARRILLO PUERTO",
        colonia_id: coloniaId || undefined,
        colonia_otro: coloniaOtro,
        colonia_pendiente_revision: coloniaPendiente,
      },
      contactos_oficiales: contactos,
      estatus: "ACTIVO",
      creado_el: initialAlumno?.creado_el || new Date().toISOString(),
    };

    await saveAlumno(alumnoData);
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl text-sm">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-base">
              {initialAlumno ? "Editar Expediente de Alumno" : "Nuevo Registro de Alumno"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Section 1: General Student Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b pb-1 font-mono text-xs text-cyan-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              DATOS ESCOLARES Y MATRÍCULA INMUTABLE POR SERIE
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Grado de Ingreso *
                </label>
                <select
                  value={grado}
                  onChange={(e) => {
                    const g = Number(e.target.value) as 1 | 2 | 3;
                    setGrado(g);
                    updateMatriculaForGrado(g);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-cyan-600 font-bold"
                >
                  <option value={1}>1º Sec. (Serie 26-)</option>
                  <option value={2}>2º Sec. (Serie 25-)</option>
                  <option value={3}>3º Sec. (Serie 24-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Matrícula Inmutable
                </label>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  readOnly={!!initialAlumno}
                  className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-cyan-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CURP</label>
                <input
                  type="text"
                  value={curp}
                  onChange={(e) => setCurp(e.target.value)}
                  placeholder="AOCN131222MQTRSA9"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo del Alumno *</label>
              <input
                type="text"
                required
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="ej. ACOSTA CRUZ NASHLA MAHELY"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold uppercase focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grupo</label>
                <select
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-cyan-600"
                >
                  {["A", "B", "C", "D", "E", "F", "G"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Lista</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={noLista}
                  onChange={(e) => setNoLista(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Turno</label>
                <select
                  value={turno}
                  onChange={(e) => setTurno(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-cyan-600"
                >
                  <option value="MATUTINO">Matutino</option>
                  <option value="VESPERTINO">Vespertino</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sexo</label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-cyan-600"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Fecha de Nacimiento (YYYY-MM-DD) *
                </label>
                <span className="text-xs font-bold text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded-full border border-cyan-200 flex items-center gap-1 shadow-2xs">
                  <span>🎂 Edad calculada:</span>
                  <strong className="text-cyan-950 font-black">{calcularEdad(fechaNacimiento)} años</strong>
                </span>
              </div>
              <input
                type="date"
                required
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-cyan-600 font-medium"
              />
            </div>
          </div>

          {/* Section 2: Address */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 border-b pb-1 font-mono text-xs text-cyan-800 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-cyan-600" />
              DOMICILIO PARTICULAR Y CATÁLOGO DE COLONIAS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Calle y Número *</label>
                <input
                  type="text"
                  required
                  value={calleNumero}
                  onChange={(e) => setCalleNumero(e.target.value)}
                  placeholder="ej. NIÑOS HEROES NO. 13"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div>
                <ColoniaSelect
                  value={coloniaStr}
                  coloniaOtro={coloniaOtro}
                  coloniaPendiente={coloniaPendiente}
                  onChange={({ colonia, colonia_id, colonia_otro, colonia_pendiente_revision }) => {
                    setColoniaStr(colonia);
                    setColoniaId(colonia_id || "");
                    setColoniaOtro(colonia_otro);
                    setColoniaPendiente(colonia_pendiente_revision);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Official 3 Contacts */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b pb-1 font-mono text-xs text-cyan-800 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-cyan-600" />
              DIRECTORIO DE 3 CONTACTOS OFICIALES Y DATOS DE TRABAJO
            </h3>

            {/* Contact 1 */}
            <div className="p-4 bg-cyan-50/60 border border-cyan-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-950 font-mono">
                <span>1. Tutor Legal Principal (Con INE) *</span>
                <span className="bg-cyan-600 text-white px-2 py-0.5 rounded text-[10px]">REQUERIDO</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={t1Nombre}
                    onChange={(e) => setT1Nombre(e.target.value)}
                    placeholder="MARIA CRUZ FUENTES"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parentesco</label>
                  <input
                    type="text"
                    value={t1Parentesco}
                    onChange={(e) => setT1Parentesco(e.target.value)}
                    placeholder="Madre / Padre"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Personal *</label>
                  <input
                    type="tel"
                    required
                    value={t1Telefono}
                    onChange={(e) => setT1Telefono(e.target.value)}
                    placeholder="4428368526"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Lugar de Trabajo</label>
                  <input
                    type="text"
                    value={t1Trabajo}
                    onChange={(e) => setT1Trabajo(e.target.value)}
                    placeholder="Empresa / Negocio"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono Trabajo</label>
                  <input
                    type="tel"
                    value={t1TelTrabajo}
                    onChange={(e) => setT1TelTrabajo(e.target.value)}
                    placeholder="4422110099"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Folio INE</label>
                  <input
                    type="text"
                    value={t1Ine}
                    onChange={(e) => setT1Ine(e.target.value)}
                    placeholder="IDMEX1234567890"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Contact 2 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-700 font-mono">2. Contacto Secundario (Opcional)</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={t2Nombre}
                  onChange={(e) => setT2Nombre(e.target.value)}
                  placeholder="Nombre Completo"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={t2Parentesco}
                  onChange={(e) => setT2Parentesco(e.target.value)}
                  placeholder="Parentesco"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="tel"
                  value={t2Telefono}
                  onChange={(e) => setT2Telefono(e.target.value)}
                  placeholder="Tel. Personal"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                />
                <input
                  type="text"
                  value={t2Trabajo}
                  onChange={(e) => setT2Trabajo(e.target.value)}
                  placeholder="Lugar de Trabajo"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Contact 3 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-700 font-mono">3. Contacto Terciario (Opcional)</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={t3Nombre}
                  onChange={(e) => setT3Nombre(e.target.value)}
                  placeholder="Nombre Completo"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={t3Parentesco}
                  onChange={(e) => setT3Parentesco(e.target.value)}
                  placeholder="Parentesco"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="tel"
                  value={t3Telefono}
                  onChange={(e) => setT3Telefono(e.target.value)}
                  placeholder="Tel. Personal"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                />
                <input
                  type="text"
                  value={t3Trabajo}
                  onChange={(e) => setT3Trabajo(e.target.value)}
                  placeholder="Lugar de Trabajo"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>{saving ? "Guardando..." : "Guardar Expediente"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
