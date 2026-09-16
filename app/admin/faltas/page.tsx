"use client";

import React, { useState, useEffect } from "react";
import { FaltaCatalog, SeveridadFalta } from "@/lib/types";
import { getFaltasCatalog, saveFaltaCatalog, deleteFaltaCatalog } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, Plus, Edit2, Trash2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FaltasAdminPage() {
  const { user } = useAuth();
  const [faltas, setFaltas] = useState<FaltaCatalog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombreFalta, setNombreFalta] = useState("");
  const [categoria, setCategoria] = useState<FaltaCatalog["categoria"]>("DISCIPLINARIA");
  const [severidadDefecto, setSeveridadDefecto] = useState<SeveridadFalta>("LEVE");
  const [diasSuspensionDefecto, setDiasSuspensionDefecto] = useState(0);
  const [requiereCitatorioDefecto, setRequiereCitatorioDefecto] = useState(true);
  const [activa, setActiva] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getFaltasCatalog();
      setFaltas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user || (user.role !== "SUPER_USUARIO" && user.role !== "TRABAJADORA_SOCIAL")) {
    return (
      <div className="p-8 text-center text-rose-600 font-semibold">
        Acceso restringido: Solo Administradores y Trabajo Social pueden gestionar el catálogo de faltas.
      </div>
    );
  }

  const handleOpenModal = (falta?: FaltaCatalog) => {
    if (falta) {
      setEditingId(falta.id);
      setNombreFalta(falta.nombre_falta);
      setCategoria(falta.categoria);
      setSeveridadDefecto(falta.severidad_defecto);
      setDiasSuspensionDefecto(falta.dias_suspension_defecto);
      setRequiereCitatorioDefecto(falta.requiere_citatorio_defecto);
      setActiva(falta.activa);
    } else {
      setEditingId(null);
      setNombreFalta("");
      setCategoria("DISCIPLINARIA");
      setSeveridadDefecto("LEVE");
      setDiasSuspensionDefecto(0);
      setRequiereCitatorioDefecto(true);
      setActiva(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreFalta.trim()) return;

    setSaving(true);
    try {
      const id = editingId || `falta-${Date.now()}`;
      await saveFaltaCatalog({
        id,
        nombre_falta: nombreFalta.trim(),
        categoria,
        severidad_defecto: severidadDefecto,
        dias_suspension_defecto: Number(diasSuspensionDefecto),
        requiere_citatorio_defecto: requiereCitatorioDefecto,
        activa,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error guardando falta:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar del catálogo la falta "${nombre}"?`)) {
      await deleteFaltaCatalog(id);
      await loadData();
    }
  };

  const getSeveridadBadge = (sev: SeveridadFalta) => {
    switch (sev) {
      case "LEVE":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "MODERADA":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "GRAVE":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "SEVERA":
        return "bg-rose-50 text-rose-700 border border-rose-200 font-semibold";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <div className="flex items-center space-x-3">
            <Link
              href="/incidentes"
              className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 hover:text-slate-950 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                Catálogo Configurable de Faltas
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Define severidades y días de suspensión predeterminados para agilizar el registro de incidentes.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar Falta</span>
          </button>
        </div>

        {/* Catalog Table */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Cargando catálogo...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                    <th className="py-3 px-5 font-bold">Falta / Conducta</th>
                    <th className="py-3 px-5 font-bold">Categoría</th>
                    <th className="py-3 px-5 font-bold">Severidad Defecto</th>
                    <th className="py-3 px-5 font-bold text-center">Días Suspensión</th>
                    <th className="py-3 px-5 font-bold text-center">Citatorio</th>
                    <th className="py-3 px-5 font-bold text-center">Estado</th>
                    <th className="py-3 px-5 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {faltas.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 font-medium text-slate-900 max-w-xs">{f.nombre_falta}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          {f.categoria}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getSeveridadBadge(f.severidad_defecto)}`}>
                          {f.severidad_defecto}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-medium text-slate-800">
                        {f.dias_suspension_defecto} día(s)
                      </td>
                      <td className="py-4 px-6 text-center font-medium">
                        {f.requiere_citatorio_defecto ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[11px] border border-blue-200 font-medium">
                            Sí Requiere
                          </span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {f.activa ? (
                          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400 text-[11px]">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Inactiva
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(f)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id, f.nombre_falta)}
                          className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-lg w-full overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  {editingId ? "Editar Falta del Catálogo" : "Agregar Nueva Falta al Catálogo"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre / Descripción de la Falta</label>
                  <input
                    type="text"
                    value={nombreFalta}
                    onChange={(e) => setNombreFalta(e.target.value)}
                    required
                    placeholder="Ej. Uso indebido de celular en clase"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DISCIPLINARIA">DISCIPLINARIA</option>
                      <option value="ASISTENCIA">ASISTENCIA</option>
                      <option value="BULLYING">BULLYING</option>
                      <option value="ACADÉMICA">ACADÉMICA</option>
                      <option value="VANDALISMO">VANDALISMO</option>
                      <option value="OTRA">OTRA</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Severidad por Defecto</label>
                    <select
                      value={severidadDefecto}
                      onChange={(e) => setSeveridadDefecto(e.target.value as SeveridadFalta)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LEVE">LEVE</option>
                      <option value="MODERADA">MODERADA</option>
                      <option value="GRAVE">GRAVE</option>
                      <option value="SEVERA">SEVERA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Días de Suspensión por Defecto</label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={diasSuspensionDefecto}
                      onChange={(e) => setDiasSuspensionDefecto(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-2">
                    <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiereCitatorioDefecto}
                        onChange={(e) => setRequiereCitatorioDefecto(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Requiere Citatorio</span>
                    </label>

                    <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activa}
                        onChange={(e) => setActiva(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Falta Activa</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    {saving ? "Guardando..." : "Guardar Falta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
