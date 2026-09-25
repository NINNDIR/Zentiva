"use client";

import React from "react";
import { Alumno, calcularEdad } from "@/lib/types";
import { ContactoButton } from "./contacto-button";
import { NotasConfidencialesSection } from "./notas-confidenciales";
import { ActivityStream } from "./activity-stream";
import {
  ShieldCheck,
  User,
  Phone,
  Home,
  Briefcase,
  IdCard,
  Edit,
  Trash2,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface Props {
  alumno: Alumno;
  onEdit: (alumno: Alumno) => void;
  onDelete: (alumno: Alumno) => void;
  isDirectivo: boolean;
}

export const AlumnoFormView: React.FC<Props> = ({
  alumno,
  onEdit,
  onDelete,
  isDirectivo,
}) => {
  const edadCalculada = calcularEdad(alumno.fecha_nacimiento);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 font-sans">
      
      {/* ServiceNow Form View Top Header with High-Contrast Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-extrabold px-3 py-1 rounded bg-slate-900 text-cyan-300 shadow-sm">
              MATRÍCULA INMUTABLE: {alumno.matricula}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
              {alumno.grado}º GRUPO "{alumno.grupo}" • {alumno.turno}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded border flex items-center gap-1 ${
                alumno.estatus === "ACTIVO"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-rose-100 text-rose-800 border-rose-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {alumno.estatus}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {alumno.nombre_completo}
          </h2>
          <p className="text-xs font-mono text-slate-500">
            CURP: <strong>{alumno.curp}</strong> • No. Lista: <strong>#{alumno.no_lista}</strong>
          </p>
        </div>

        {!isDirectivo && (
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={() => onEdit(alumno)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm"
            >
              <Edit className="w-4 h-4 text-cyan-400" />
              <span>Editar Expediente</span>
            </button>

            <button
              onClick={() => onDelete(alumno)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 font-bold border border-rose-200 rounded-xl text-xs transition flex items-center space-x-1 shadow-sm"
              title="Baja / Eliminar Expediente"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden md:inline">Baja / Borrar</span>
            </button>
          </div>
        )}
      </div>

      {/* 3-Column Section: Datos Personales & Domicilio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Column 1: Datos Personales */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-bold font-mono text-cyan-800 uppercase block border-b pb-1 border-slate-200 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-cyan-600" />
            Datos Personales
          </span>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono">Edad Calculada:</span>
              <strong className="text-slate-900">{edadCalculada} años</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono">Sexo:</span>
              <strong className="text-slate-900">{alumno.sexo === "M" ? "Masculino" : "Femenino"}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono">Fecha Nacimiento:</span>
              <strong className="text-slate-900">{alumno.fecha_nacimiento}</strong>
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Domicilio Normalizado */}
        <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-bold font-mono text-cyan-800 uppercase block border-b pb-1 border-slate-200 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-cyan-600" />
            Domicilio Particular Registrado
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-mono block">Calle y Número:</span>
              <strong className="text-slate-900 text-sm block pt-0.5">{alumno.domicilio.calle_numero}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-mono block">Colonia:</span>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <strong className="text-cyan-900 text-sm font-mono font-bold">
                  COL. {alumno.domicilio.colonia}
                </strong>
                {alumno.domicilio.colonia_pendiente_revision && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Pendiente Revisión SysAdmin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3 Contactos Oficiales Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b pb-1">
          <h3 className="font-bold text-slate-900 text-xs font-mono flex items-center gap-1.5 text-cyan-800">
            <Phone className="w-4 h-4 text-cyan-600" />
            DIRECTORIO OFICIAL DE 3 CONTACTOS Y DATOS DE TRABAJO
          </h3>
          <span className="text-[10px] font-mono text-slate-500">Expediente Completo (3/3 Slots)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              slotTitle: "1. TUTOR LEGAL PRINCIPAL",
              badgeBg: "bg-cyan-700 text-white",
              cardBg: "bg-cyan-50/70 border-cyan-300 shadow-sm",
              data: alumno.contactos_oficiales.find((c) => c.prioridad === 1) || {
                prioridad: 1 as const,
                es_tutor_legal: true,
                nombre: "TUTOR NO REGISTRADO",
                parentesco: "Tutor Principal",
                telefono: "",
              },
              hasData: !!alumno.contactos_oficiales.find((c) => c.prioridad === 1)?.nombre,
            },
            {
              slotTitle: "2. CONTACTO SECUNDARIO",
              badgeBg: "bg-slate-800 text-slate-200",
              cardBg: "bg-slate-50 border-slate-200",
              data: alumno.contactos_oficiales.find((c) => c.prioridad === 2) || {
                prioridad: 2 as const,
                es_tutor_legal: false,
                nombre: "No Registrado",
                parentesco: "Contacto 2",
                telefono: "",
              },
              hasData: !!alumno.contactos_oficiales.find((c) => c.prioridad === 2)?.nombre,
            },
            {
              slotTitle: "3. CONTACTO DE EMERGENCIA",
              badgeBg: "bg-slate-800 text-slate-200",
              cardBg: "bg-slate-50 border-slate-200",
              data: alumno.contactos_oficiales.find((c) => c.prioridad === 3) || {
                prioridad: 3 as const,
                es_tutor_legal: false,
                nombre: "No Registrado",
                parentesco: "Contacto 3",
                telefono: "",
              },
              hasData: !!alumno.contactos_oficiales.find((c) => c.prioridad === 3)?.nombre,
            },
          ].map((slot, idx) => {
            const c = slot.data;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-3 flex flex-col justify-between ${slot.cardBg}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${slot.badgeBg}`}>
                      {slot.slotTitle}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{c.parentesco}</span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {c.nombre}
                    </h4>
                    <div className="text-xs text-slate-600 font-mono pt-1 space-y-1">
                      <p>
                        Teléfono:{" "}
                        <strong className={c.telefono ? "text-slate-900" : "text-slate-400 italic font-normal"}>
                          {c.telefono || "Sin registrar"}
                        </strong>
                      </p>
                      {c.ine_folio && (
                        <p className="flex items-center gap-1 text-cyan-900 font-bold">
                          <IdCard className="w-3.5 h-3.5 text-cyan-600" />
                          INE: {c.ine_folio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Workplace Info */}
                  {(c.lugar_trabajo || c.telefono_trabajo) ? (
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 font-mono flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-cyan-600" />
                        Lugar de Trabajo:
                      </span>
                      <p className="font-medium text-slate-800">{c.lugar_trabajo || "No especificado"}</p>
                      {c.telefono_trabajo && (
                        <p className="font-mono text-slate-500">Tel. Trabajo: {c.telefono_trabajo}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-slate-100/50 border border-dashed border-slate-200 text-[11px] text-slate-400 font-mono italic">
                      Sin datos laborales
                    </div>
                  )}
                </div>

                {/* Active Call / WhatsApp Action Buttons */}
                <div className="pt-2 border-t border-slate-200/80">
                  <ContactoButton telefono={c.telefono} nombre={c.nombre} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confidential Notes Section */}
      <NotasConfidencialesSection alumnoMatricula={alumno.matricula} />

      {/* Activity Stream / Timeline Section */}
      <ActivityStream alumnoMatricula={alumno.matricula} />

    </div>
  );
};
