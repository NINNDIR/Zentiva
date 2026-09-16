"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Incidente, EstatusIncidente } from "@/lib/types";
import { getIncidenteById, updateIncidenteWithAudit, reopenIncidente } from "@/lib/firestore-service";
import { SLABadge } from "@/components/incidentes/sla-badge";
import { ActivityStream } from "@/components/incidentes/activity-stream";
import { AuditLogModal } from "@/components/incidentes/audit-log-modal";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  FileText,
  AlertTriangle,
  History,
  RotateCcw,
  FileCheck,
  Building2,
} from "lucide-react";

export default function IncidenteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const incidenteId = params?.id as string;
  const [incidente, setIncidente] = useState<Incidente | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenMotivo, setReopenMotivo] = useState("");
  const [reopening, setReopening] = useState(false);

  const cargarIncidente = async () => {
    setLoading(true);
    try {
      const data = await getIncidenteById(incidenteId);
      setIncidente(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incidenteId) {
      cargarIncidente();
    }
  }, [incidenteId]);

  if (!user) return null;

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Cargando expediente de incidente...</div>;
  }

  if (!incidente) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-bold text-rose-600">Incidente no encontrado.</p>
        <Link href="/incidentes" className="text-xs text-cyan-600 underline">
          Volver a incidentes
        </Link>
      </div>
    );
  }

  const handleToggleFirma = async () => {
    if (!user) return;
    const newValue = !incidente.firma_escaneada_adjunta;
    try {
      await updateIncidenteWithAudit(
        incidente.id,
        {
          firma_escaneada_adjunta: newValue,
          estatus: newValue ? "CERRADO" : "EN PROCESO",
        },
        user
      );
      await cargarIncidente();
    } catch (err) {
      console.error("Error actualizando firma:", err);
    }
  };

  const handleEstatusChange = async (nuevoEstatus: EstatusIncidente) => {
    if (!user) return;
    try {
      await updateIncidenteWithAudit(incidente.id, { estatus: nuevoEstatus }, user);
      await cargarIncidente();
    } catch (err) {
      console.error("Error al actualizar estatus:", err);
    }
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenMotivo.trim() || !user) return;

    setReopening(true);
    try {
      await reopenIncidente(incidente.id, user, reopenMotivo.trim());
      setIsReopenModalOpen(false);
      setReopenMotivo("");
      await cargarIncidente();
    } catch (err) {
      console.error("Error al reabrir ticket:", err);
    } finally {
      setReopening(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
          <div className="flex items-center space-x-3">
            <Link
              href="/incidentes"
              className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 hover:text-slate-950 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-black text-slate-900 text-lg">{incidente.folio}</span>
                <SLABadge
                  fechaHora={incidente.fecha_hora}
                  estatus={incidente.estatus}
                  tieneFirma={incidente.firma_escaneada_adjunta}
                />
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Registrado el {new Date(incidente.creado_el).toLocaleString("es-MX")}</p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <History className="w-4 h-4 text-cyan-700" />
              <span>Auditoría de Cambios</span>
            </button>

            {incidente.estatus === "CERRADO" ? (
              <button
                onClick={() => setIsReopenModalOpen(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reabrir Ticket</span>
              </button>
            ) : (
              <button
                onClick={handleToggleFirma}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold shadow transition flex items-center space-x-1.5 ${
                  incidente.firma_escaneada_adjunta
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                    : "bg-cyan-700 hover:bg-cyan-800 text-white"
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>
                  {incidente.firma_escaneada_adjunta
                    ? "✓ Convenio Firmado y Escaneado"
                    : "Marcar Convenio Firmado"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Incidente Detail Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info Card (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview Card */}
            <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded uppercase">
                  Categoría: {incidente.categoria}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{incidente.falta_nombre}</h2>
              </div>

              {/* Alumnos Implicados */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">Alumnos Implicados</h3>
                <div className="space-y-2">
                  {incidente.implicados.map((imp, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{imp.nombre_completo}</span>
                        <span className="text-[11px] text-slate-600 font-mono">
                          Matrícula: {imp.alumno_matricula} | Grado: {imp.grado}° {imp.grupo}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-bold border border-blue-200 rounded text-[11px]">
                        {imp.rol_implicado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hechos */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase mb-1">Descripción de los Hechos</h3>
                <p className="text-xs text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                  {incidente.descripcion_hechos}
                </p>
              </div>

              {/* Sanctions & Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-300 text-xs">
                <div>
                  <span className="text-slate-600 font-medium block text-[11px]">Días de Suspensión:</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">{incidente.dias_suspension} días</span>
                </div>

                <div>
                  <span className="text-slate-600 font-medium block text-[11px]">Fecha Reincorporación (Día Hábil):</span>
                  <span className="font-bold text-rose-800 text-sm font-mono">
                    {incidente.reincorporacion_fecha || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-600 font-medium block text-[11px]">Citatorio a Tutores:</span>
                  <span className="font-bold text-slate-900">
                    {incidente.requiere_citatorio
                      ? `Sí (${incidente.citatorio_fecha_hora || "Fecha pendiente"})`
                      : "No Requiere"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-600 font-medium block text-[11px]">Tutor Notificado:</span>
                  <span className="font-bold text-slate-900">
                    {incidente.tutor_notificado ? "✓ Sí Notificado" : "⏳ Pendiente"}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Stream (Comments Feed) */}
            <ActivityStream
              incidenteId={incidente.id}
              currentUser={user}
              canAddComment={incidente.estatus !== "CERRADO" || user.role === "SUPER_USUARIO" || user.role === "TRABAJADORA_SOCIAL"}
            />
          </div>

          {/* Right Status Control Sidebar (1 Col) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-2">
                Estado y Control de Ticket
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-700 font-bold text-[11px] block mb-1">Estatus Actual:</label>
                  <select
                    value={incidente.estatus}
                    onChange={(e) => handleEstatusChange(e.target.value as EstatusIncidente)}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="ABIERTO">ABIERTO</option>
                    <option value="EN PROCESO">EN PROCESO</option>
                    <option value="CERRADO">CERRADO</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Convenio Firmado:</span>
                    <span className="font-bold">
                      {incidente.firma_escaneada_adjunta ? "✓ Sí" : "✕ No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Creado Por:</span>
                    <span className="font-semibold text-slate-800">{incidente.creado_por_nombre}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Modal */}
        <AuditLogModal
          incidenteId={incidente.id}
          folio={incidente.folio}
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
        />

        {/* Reopen Modal */}
        {isReopenModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-md w-full overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-sm">Motivo de Reapertura de Ticket</h3>
                <button onClick={() => setIsReopenModalOpen(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleReopenSubmit} className="p-6 space-y-4 text-xs">
                <p className="text-slate-600">
                  Al reabrir el ticket <span className="font-mono font-bold text-slate-900">{incidente.folio}</span>, su estatus cambiará a <strong>EN PROCESO</strong> y se registrará una entrada en la auditoría de cambios.
                </p>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Motivo Obligatorio</label>
                  <textarea
                    rows={3}
                    value={reopenMotivo}
                    onChange={(e) => setReopenMotivo(e.target.value)}
                    required
                    placeholder="Ej. Incumplimiento de acuerdo por parte del alumno o nueva evidencia presentada..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
                  />
                </div>

                <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsReopenModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={reopening || !reopenMotivo.trim()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow"
                  >
                    {reopening ? "Reabriendo..." : "Confirmar Reapertura"}
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
