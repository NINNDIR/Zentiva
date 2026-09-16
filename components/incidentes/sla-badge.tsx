"use client";

import React from "react";
import { obtenerSLAInfo, EstatusIncidente } from "@/lib/types";
import { Clock, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

interface SLABadgeProps {
  fechaHora: string;
  estatus: EstatusIncidente;
  tieneFirma: boolean;
  className?: string;
}

export const SLABadge: React.FC<SLABadgeProps> = ({
  fechaHora,
  estatus,
  tieneFirma,
  className = "",
}) => {
  const sla = obtenerSLAInfo(fechaHora, estatus, tieneFirma);

  const renderIcon = () => {
    switch (sla.color) {
      case "VERDE":
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case "AMARILLO":
        return <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />;
      case "ROJO":
        return <AlertOctagon className="w-3.5 h-3.5 mr-1 text-rose-700 animate-spin" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${sla.badgeClass} ${className}`}
    >
      {renderIcon()}
      <span>{sla.label}</span>
    </span>
  );
};
