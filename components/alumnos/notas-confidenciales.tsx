"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { NotaConfidencial, CategoriaNota } from "@/lib/types";
import { getNotasConfidenciales, addNotaConfidencial } from "@/lib/firestore-service";
import {
  Lock,
  ShieldAlert,
  Plus,
  Calendar,
  User,
  Tag,
  Send,
  Sparkles,
} from "lucide-react";

interface Props {
  alumnoMatricula: string;
}

export const NotasConfidencialesSection: React.FC<Props> = ({ alumnoMatricula }) => {
  const { user } = useAuth();
  const [notas, setNotas] = useState<NotaConfidencial[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New note form state
  const [contenido, setContenido] = useState("");
  const [categoria, setCategoria] = useState<CategoriaNota>("FAMILIAR");
  const [saving, setSaving] = useState(false);

  const isDirectivo = user?.role === "DIRECTIVO";

  useEffect(() => {
    if (!isDirectivo && alumnoMatricula) {
      loadNotas();
    }
  }, [alumnoMatricula, isDirectivo]);

  const loadNotas = async () => {
    setLoading(true);
    const list = await getNotasConfidenciales(alumnoMatricula);
    setNotas(list);
    setLoading(false);
  };

  const handleAddNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim() || !user) return;

    setSaving(true);
    const nowStr = new Date().toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    await addNotaConfidencial({
      alumno_matricula: alumnoMatricula,
      fecha: nowStr,
      autor_uid: user.uid,
      autor_nombre: user.displayName,
      autor_cargo: user.cargo,
      categoria,
      contenido: contenido.trim(),
    });

    setContenido("");
    setSaving(false);
    await loadNotas();
  };

  // RESTRICTED VIEW FOR DIRECTIVOSS
  if (isDirectivo) {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-amber-950 text-base">
            Acceso Restringido - Notas Confidenciales
          </h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto mt-1 leading-relaxed">
            De acuerdo con el protocolo legal y de privacidad de Zentiva, las notas confidenciales de Trabajo Social están protegidas y reservadas únicamente para la Trabajadora Social y el Super Usuario.
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-[11px] font-mono font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
          <span>Restricción de Lectura y Escritura Activa</span>
        </div>
      </div>
    );
  }

  const getCategoriaBadge = (cat: CategoriaNota) => {
    switch (cat) {
      case "FAMILIAR":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SALUD":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "ACADÉMICO":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CONDUCTUAL":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "VULNERABILIDAD":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-cyan-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Bitácora de Notas Confidenciales
          </h3>
        </div>
        <span className="text-xs font-mono bg-cyan-50 text-cyan-800 px-2.5 py-1 rounded-md border border-cyan-200 font-semibold">
          Acceso Exclusivo Trabajo Social / SU
        </span>
      </div>

      {/* Add New Note Form */}
      <form onSubmit={handleAddNota} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-cyan-600" />
            Nueva Nota de Seguimiento Confidencial
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-500 font-medium">Categoría:</span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaNota)}
              className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-cyan-600"
            >
              <option value="FAMILIAR">Familiar</option>
              <option value="ACADÉMICO">Académico</option>
              <option value="CONDUCTUAL">Conductual</option>
              <option value="SALUD">Salud</option>
              <option value="VULNERABILIDAD">Vulnerabilidad</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>

        <textarea
          rows={3}
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribe aquí los hallazgos de la entrevista, acuerdos confidenciales o notas de seguimiento legal..."
          className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 transition resize-none"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !contenido.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? "Guardando..." : "Registrar Nota Confidencial"}</span>
          </button>
        </div>
      </form>

      {/* Notes List Timeline */}
      {loading ? (
        <div className="text-center py-6 text-xs text-slate-500">Cargando bitácora confidencial...</div>
      ) : notas.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 p-6 rounded-xl text-center text-xs text-slate-500">
          No hay notas confidenciales registradas para este expediente.
        </div>
      ) : (
        <div className="space-y-3">
          {notas.map((nota) => (
            <div
              key={nota.id}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm relative hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getCategoriaBadge(nota.categoria)}`}>
                    {nota.categoria}
                  </span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {nota.autor_nombre} ({nota.autor_cargo})
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {nota.fecha}
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line pt-1">
                {nota.contenido}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
