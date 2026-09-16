"use client";

import React, { useState, useEffect } from "react";
import { AnexoComentario, UserProfile } from "@/lib/types";
import { getAnexosComentarios, addAnexoComentario } from "@/lib/firestore-service";
import { MessageSquare, Send, User, Clock, ShieldCheck } from "lucide-react";

interface ActivityStreamProps {
  incidenteId: string;
  currentUser: UserProfile;
  canAddComment?: boolean;
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({
  incidenteId,
  currentUser,
  canAddComment = true,
}) => {
  const [comentarios, setComentarios] = useState<AnexoComentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const cargarComentarios = async () => {
    setLoading(true);
    try {
      const data = await getAnexosComentarios(incidenteId);
      setComentarios(data);
    } catch (err) {
      console.error("Error al cargar comentarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarComentarios();
  }, [incidenteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setSubmitting(true);
    try {
      const now = new Date();
      const fechaHoraStr = now.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) + " - " + now.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      });

      await addAnexoComentario({
        incidente_id: incidenteId,
        usuario_uid: currentUser.uid,
        usuario_nombre: currentUser.displayName,
        usuario_cargo: currentUser.cargo,
        fecha_hora: fechaHoraStr,
        comentario: nuevoComentario.trim(),
      });

      setNuevoComentario("");
      await cargarComentarios();
    } catch (err) {
      console.error("Error guardando comentario:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-cyan-600" />
          <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
            BITÁCORA DE SEGUIMIENTO (ACTIVITY STREAM)
          </h3>
        </div>
        <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
          {comentarios.length} Anexos
        </span>
      </div>

      {/* Input box for new comment */}
      {canAddComment && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Agregar nota de seguimiento, acuerdo con tutores o avance de caso..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition outline-none resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !nuevoComentario.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Guardando..." : "Anexar Comentario"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Stream list */}
      {loading ? (
        <div className="text-center py-6 text-xs text-slate-400">Cargando bitácora...</div>
      ) : comentarios.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <p className="text-xs text-slate-500 font-medium">No se han registrado comentarios en este expediente aún.</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
          {comentarios.map((item) => (
            <div key={item.id} className="relative flex items-start space-x-3 pl-8">
              <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 w-full">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800">{item.usuario_nombre}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-1.5 py-0.5 rounded">
                      {item.usuario_cargo}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.fecha_hora}
                  </span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{item.comentario}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
