"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaltaCatalog, Alumno, ImplicadoIncidente, SeveridadFalta, calcularFechaReincorporacion } from "@/lib/types";
import { getFaltasCatalog, getAlumnos, saveIncidente } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth-context";
import { ShieldAlert, ArrowLeft, Plus, Trash2, Calendar, UserPlus, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function NuevoIncidentePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [faltas, setFaltas] = useState<FaltaCatalog[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedFaltaId, setSelectedFaltaId] = useState("");
  const [fechaHora, setFechaHora] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0] + " " + now.toTimeString().slice(0, 5);
  });
  const [severidad, setSeveridad] = useState<SeveridadFalta>("LEVE");
  const [categoria, setCategoria] = useState("DISCIPLINARIA");
  const [faltaNombre, setFaltaNombre] = useState("");
  const [descripcionHechos, setDescripcionHechos] = useState("");

  const [diasSuspension, setDiasSuspension] = useState(0);
  const [fechaFinSuspension, setFechaFinSuspension] = useState("");
  const [reincorporacionFecha, setReincorporacionFecha] = useState("");

  const [requiereCitatorio, setRequiereCitatorio] = useState(false);
  const [citatorioFechaHora, setCitatorioFechaHora] = useState("");
  const [tutorNotificado, setTutorNotificado] = useState(false);

  // Implicated list
  const [implicados, setImplicados] = useState<ImplicadoIncidente[]>([]);
  const [selectedMatricula, setSelectedMatricula] = useState("");
  const [selectedRol, setSelectedRol] = useState<"AGRESOR" | "VÍCTIMA" | "TESTIGO">("VÍCTIMA");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fList, aList] = await Promise.all([getFaltasCatalog(), getAlumnos()]);
        setFaltas(fList.filter((f) => f.activa));
        setAlumnos(aList);
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update dates when fechaHora or diasSuspension changes
  useEffect(() => {
    if (diasSuspension > 0) {
      const fechaBase = fechaHora.split(" ")[0];
      const { fechaFin, fechaRegreso } = calcularFechaReincorporacion(fechaBase, diasSuspension);
      setFechaFinSuspension(fechaFin);
      setReincorporacionFecha(fechaRegreso);
    } else {
      setFechaFinSuspension("");
      setReincorporacionFecha("");
    }
  }, [fechaHora, diasSuspension]);

  // Handle falta dropdown change (Autocompletion)
  const handleFaltaChange = (faltaId: string) => {
    setSelectedFaltaId(faltaId);
    const target = faltas.find((f) => f.id === faltaId);
    if (target) {
      setFaltaNombre(target.nombre_falta);
      setCategoria(target.categoria);
      setSeveridad(target.severidad_defecto);
      setDiasSuspension(target.dias_suspension_defecto);
      setRequiereCitatorio(target.requiere_citatorio_defecto);
    }
  };

  const handleAddImplicado = () => {
    if (!selectedMatricula) return;
    const target = alumnos.find((a) => a.matricula === selectedMatricula);
    if (!target) return;

    if (implicados.some((i) => i.alumno_matricula === target.matricula)) {
      alert("Este alumno ya fue agregado a la lista de implicados.");
      return;
    }

    setImplicados([
      ...implicados,
      {
        alumno_matricula: target.matricula,
        nombre_completo: target.nombre_completo,
        grado: target.grado,
        grupo: target.grupo,
        rol_implicado: selectedRol,
      },
    ]);
    setSelectedMatricula("");
  };

  const handleRemoveImplicado = (matr: string) => {
    setImplicados(implicados.filter((i) => i.alumno_matricula !== matr));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faltaNombre.trim()) {
      alert("Por favor selecciona o ingresa el nombre de la falta.");
      return;
    }

    if (implicados.length === 0) {
      alert("Debes agregar al menos un alumno implicado en el incidente.");
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      const created = await saveIncidente({
        fecha_hora: fechaHora,
        falta_id: selectedFaltaId || "falta-custom",
        falta_nombre: faltaNombre,
        categoria,
        severidad,
        implicados,
        descripcion_hechos: descripcionHechos.trim(),
        estatus: "ABIERTO",
        dias_suspension: Number(diasSuspension),
        fecha_fin_suspension: fechaFinSuspension,
        reincorporacion_fecha: reincorporacionFecha,
        requiere_citatorio: requiereCitatorio,
        citatorio_fecha_hora: citatorioFechaHora,
        tutor_notificado: tutorNotificado,
        firma_escaneada_adjunta: false,
        creado_por_uid: user.uid,
        creado_por_nombre: user.displayName,
        creado_el: new Date().toISOString(),
      });

      router.push(`/incidentes/${created.id}`);
    } catch (err) {
      console.error("Error al registrar incidente:", err);
      alert("Ocurrió un error al guardar el incidente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Cargando formulario...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <Link
            href="/incidentes"
            className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 hover:text-slate-950 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-blue-600" />
              Nuevo Reporte de Incidente Disciplinario
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Autocompletado automático de severidad y cálculo dinámico de suspensión y día hábil de reincorporación.
            </p>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-6">
          
          {/* Section 1: Falta selection & Template */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-2">
              1. Selección de Falta del Catálogo (Autocompletado)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Plantilla / Falta del Catálogo</label>
                <select
                  value={selectedFaltaId}
                  onChange={(e) => handleFaltaChange(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-medium"
                >
                  <option value="">-- Selecciona una falta para autocompletar --</option>
                  {faltas.map((f) => (
                    <option key={f.id} value={f.id}>
                      [{f.categoria}] {f.nombre_falta} ({f.severidad_defecto})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fecha y Hora del Incidente</label>
                <input
                  type="text"
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Falta</label>
                <input
                  type="text"
                  value={faltaNombre}
                  onChange={(e) => setFaltaNombre(e.target.value)}
                  required
                  placeholder="Descripción de la falta..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Severidad</label>
                <select
                  value={severidad}
                  onChange={(e) => setSeveridad(e.target.value as SeveridadFalta)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold"
                >
                  <option value="LEVE">LEVE</option>
                  <option value="MODERADA">MODERADA</option>
                  <option value="GRAVE">GRAVE</option>
                  <option value="SEVERA">SEVERA</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Alumnos Implicados */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-2">
              2. Alumnos Implicados en el Incidente
            </h2>

            <div className="flex flex-col sm:flex-row items-end gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">Seleccionar Alumno</label>
                <select
                  value={selectedMatricula}
                  onChange={(e) => setSelectedMatricula(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono"
                >
                  <option value="">-- Elige un alumno(a) --</option>
                  {alumnos.map((a) => (
                    <option key={a.matricula} value={a.matricula}>
                      [{a.matricula}] {a.nombre_completo} ({a.grado}° {a.grupo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-40">
                <label className="text-xs font-bold text-slate-700 block mb-1">Rol Implicado</label>
                <select
                  value={selectedRol}
                  onChange={(e) => setSelectedRol(e.target.value as any)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold"
                >
                  <option value="AGRESOR">AGRESOR</option>
                  <option value="VÍCTIMA">VÍCTIMA</option>
                  <option value="TESTIGO">TESTIGO</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddImplicado}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            {/* List of added implicados */}
            <div className="space-y-2">
              {implicados.map((imp) => (
                <div key={imp.alumno_matricula} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{imp.nombre_completo}</span>
                    <span className="text-slate-500 text-[11px] font-mono ml-2">
                      [{imp.alumno_matricula}] ({imp.grado}° {imp.grupo})
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 border text-slate-700">
                      {imp.rol_implicado}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImplicado(imp.alumno_matricula)}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Hechos */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 uppercase block">3. Descripción Detallada de los Hechos</label>
            <textarea
              rows={4}
              value={descripcionHechos}
              onChange={(e) => setDescripcionHechos(e.target.value)}
              required
              placeholder="Describa el evento, lugar, hora y docentes/prefectos intervinientes..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
            />
          </div>

          {/* Section 4: Dynamic Suspension & Reincorporation Math */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 pt-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              4. Medida Disciplinaria y Cálculo de Reincorporación (Días Hábiles)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Días de Suspensión</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={diasSuspension}
                  onChange={(e) => setDiasSuspension(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fecha Término Suspensión</label>
                <input
                  type="text"
                  value={fechaFinSuspension}
                  onChange={(e) => setFechaFinSuspension(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-rose-800 block mb-1">Regreso / Reincorporación (Siguiente Día Hábil)</label>
                <input
                  type="text"
                  value={reincorporacionFecha}
                  onChange={(e) => setReincorporacionFecha(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full text-xs p-2.5 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono font-bold text-rose-900 bg-rose-50/50"
                />
              </div>
            </div>

            {diasSuspension > 0 && (
              <p className="text-[11px] text-slate-500 italic">
                ℹ️ El cálculo omite automáticamente sábados y domingos. Puedes modificar las fechas manualmente si existe suspensión en días inhábiles oficiales.
              </p>
            )}
          </div>

          {/* Section 5: Citatorio a Tutor */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">5. Notificación y Citatorio a Tutores Legalmente Vinculante</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiereCitatorio}
                    onChange={(e) => setRequiereCitatorio(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Requiere Citatorio Presencial en Plantel</span>
                </label>

                {requiereCitatorio && (
                  <input
                    type="text"
                    value={citatorioFechaHora}
                    onChange={(e) => setCitatorioFechaHora(e.target.value)}
                    placeholder="Fecha y hora citatorio (ej. 2026-09-17 10:00 AM)"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                )}
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tutorNotificado}
                    onChange={(e) => setTutorNotificado(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Tutor Notificado Vía Telefónica / Mensaje Oficial</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-6 border-t border-slate-200 flex justify-end space-x-3">
            <Link
              href="/incidentes"
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow transition flex items-center space-x-2"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>{saving ? "Generando Ticket..." : "Guardar Ticket de Incidente"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
