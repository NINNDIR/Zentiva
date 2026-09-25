"use client";

import React, { useState, useEffect } from "react";
import { ColoniaCatalog } from "@/lib/types";
import { subscribeColonias } from "@/lib/firestore-service";
import { MapPin, AlertCircle, Sparkles } from "lucide-react";

interface ColoniaSelectProps {
  value: string;
  coloniaOtro?: boolean;
  coloniaPendiente?: boolean;
  onChange: (data: {
    colonia: string;
    colonia_id?: string;
    colonia_otro: boolean;
    colonia_pendiente_revision: boolean;
  }) => void;
  disabled?: boolean;
}

export const ColoniaSelect: React.FC<ColoniaSelectProps> = ({
  value,
  coloniaOtro = false,
  coloniaPendiente = false,
  onChange,
  disabled = false,
}) => {
  const [colonias, setColonias] = useState<ColoniaCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOtro, setIsOtro] = useState(coloniaOtro);
  const [customText, setCustomText] = useState(coloniaOtro ? value : "");

  useEffect(() => {
    const unsubscribe = subscribeColonias((list) => {
      // Ordenar alfabéticamente
      const sorted = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
      setColonias(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sincronizar estado inicial si cambia la prop
  useEffect(() => {
    if (coloniaOtro) {
      setIsOtro(true);
      setCustomText(value);
    } else {
      setIsOtro(false);
    }
  }, [value, coloniaOtro]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;

    if (val === "__OTRO__") {
      setIsOtro(true);
      const textToUse = customText.trim() || "";
      onChange({
        colonia: textToUse.toUpperCase(),
        colonia_otro: true,
        colonia_pendiente_revision: true,
      });
    } else {
      setIsOtro(false);
      const selected = colonias.find((c) => c.nombre.toUpperCase() === val.toUpperCase());
      onChange({
        colonia: val.toUpperCase(),
        colonia_id: selected?.id,
        colonia_otro: false,
        colonia_pendiente_revision: false,
      });
    }
  };

  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCustomText(text);
    onChange({
      colonia: text.toUpperCase().trim(),
      colonia_otro: true,
      colonia_pendiente_revision: true,
    });
  };

  // Determinar el valor actual del <select>
  const matchInCatalog = colonias.some(
    (c) => c.nombre.toUpperCase() === value.toUpperCase()
  );
  const selectValue = isOtro || (!matchInCatalog && value) ? "__OTRO__" : value.toUpperCase();

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700">
        Colonia de Residencia *
      </label>

      <div className="relative">
        <select
          value={selectValue}
          onChange={handleSelectChange}
          disabled={disabled || loading}
          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-cyan-600 appearance-none pr-8 cursor-pointer disabled:opacity-60"
        >
          {loading && <option value="">Cargando colonias de Firestore...</option>}
          
          {!loading && (
            <>
              <option value="">-- Selecciona una colonia --</option>
              {colonias.map((col) => (
                <option key={col.id} value={col.nombre.toUpperCase()}>
                  {col.nombre.toUpperCase()} {col.codigo_postal ? `(C.P. ${col.codigo_postal})` : ""}
                </option>
              ))}
              <option disabled>──────────────</option>
              <option value="__OTRO__" className="text-cyan-700 font-bold">
                ➕ Otra colonia (No listada en catálogo...)
              </option>
            </>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
          <MapPin className="w-4 h-4 text-cyan-600" />
        </div>
      </div>

      {/* Campo extra cuando el usuario selecciona "Otro" */}
      {isOtro && (
        <div className="space-y-2 pt-1 animate-fadeIn">
          <div>
            <label className="block text-[11px] font-bold text-cyan-900 mb-1">
              Nombre de la Nueva Colonia:
            </label>
            <input
              type="text"
              required={isOtro}
              value={customText}
              onChange={handleCustomTextChange}
              placeholder="Escribe el nombre de la colonia..."
              className="w-full p-2.5 bg-cyan-50/50 border border-cyan-300 rounded-lg text-sm font-bold uppercase text-slate-900 focus:outline-none focus:border-cyan-600 placeholder:normal-case placeholder:font-normal"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Indicador para Revisión de SysAdmin</strong>
              <span>
                Esta colonia no está registrada en el catálogo oficial escolar. Se guardará con la bandera de{" "}
                <em className="font-semibold text-amber-950">revisión pendiente</em> para que el Administrador del Sistema la audite y valide.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
