"use client";

import React from "react";
import { Phone, MessageCircle } from "lucide-react";

interface ContactoButtonProps {
  telefono: string;
  nombre: string;
  size?: "sm" | "md";
}

export const ContactoButton: React.FC<ContactoButtonProps> = ({
  telefono,
  nombre,
  size = "md",
}) => {
  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanNumber = telefono.replace(/\D/g, "");
  
  // Format formatted phone for WhatsApp Mexico standard if 10 digits
  const waNumber = cleanNumber.length === 10 ? `52${cleanNumber}` : cleanNumber;
  const waUrl = `https://wa.me/${waNumber}?text=Estimado(a)%20${encodeURIComponent(nombre)},%20le%20contacto%20de%20Trabajo%20Social%20de%20la%20Secundaria%20General%20No.%2014.`;
  const telUrl = `tel:${cleanNumber}`;

  const buttonPadding = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs";

  if (!cleanNumber || cleanNumber.length < 7) {
    return (
      <span className="text-[11px] text-slate-400 font-mono italic flex items-center gap-1">
        <Phone className="w-3 h-3 text-slate-300" />
        Sin teléfono registrado
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Phone Call Direct Button */}
      <a
        href={telUrl}
        className={`inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 transition shadow-sm ${buttonPadding}`}
        title={`Llamar a ${nombre} (${telefono})`}
      >
        <Phone className="w-3.5 h-3.5 text-slate-700" />
        <span>Llamar</span>
      </a>

      {/* WhatsApp Direct 1-Click Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition shadow-sm ${buttonPadding}`}
        title={`Enviar WhatsApp a ${nombre}`}
      >
        <MessageCircle className="w-3.5 h-3.5 fill-current" />
        <span>WhatsApp</span>
      </a>
    </div>
  );
};
