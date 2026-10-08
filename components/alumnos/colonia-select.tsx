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

  const handleColoniaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.trimStart();
    const selected = colonias.find((c) => c.activa && !c.pendiente_revision && c.nombre.toUpperCase() === text.trim().toUpperCase());
    if (selected) {
      setIsOtro(false);
      setCustomText("");
      onChange({ colonia: selected.nombre.toUpperCase(), colonia_id: selected.id, colonia_otro: false, colonia_pendiente_revision: false });
      return;
    }

    setIsOtro(text.length > 0);
    setCustomText(text);
    onChange({ colonia: text.toUpperCase().trim(), colonia_otro: text.length > 0, colonia_pendiente_revision: text.length > 0 });
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700">
        Colonia de Residencia *
      </label>

      <div className="relative">
        <input
          list="zentiva-colonias-catalogo"
          value={isOtro ? customText : value}
          onChange={handleColoniaChange}
          placeholder={loading ? "Cargando colonias…" : "Escribe para buscar o selecciona una colonia"}
          disabled={disabled || loading}
          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-cyan-600 pr-8 disabled:opacity-60"
        />
        <datalist id="zentiva-colonias-catalogo">
          {colonias.filter((col) => col.activa && !col.pendiente_revision).map((col) => (
            <option key={col.id} value={col.nombre.toUpperCase()}>{col.codigo_postal ? `C.P. ${col.codigo_postal}` : ""}</option>
          ))}
        </datalist>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
          <MapPin className="w-4 h-4 text-cyan-600" />
        </div>
      </div>

      {isOtro && (
        <div className="space-y-2 pt-1 animate-fadeIn">
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
