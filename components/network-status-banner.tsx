"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export const NetworkStatusBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Initial check
    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 shadow-lg border-b border-amber-600 flex items-center justify-center space-x-2.5 text-xs font-black tracking-wide font-sans animate-in slide-in-from-top duration-300">
      <div className="w-6 h-6 rounded-full bg-amber-950/20 flex items-center justify-center flex-shrink-0 text-slate-950">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <span>
        ⚠️ Sin conexión a la red o Firebase. Zentiva está operando en modo local fuera de línea. Los datos se respaldan localmente y se sincronizarán al restablecer la conexión.
      </span>
      <button
        onClick={() => window.location.reload()}
        className="ml-2 px-2.5 py-1 bg-slate-950 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition flex items-center space-x-1 cursor-pointer flex-shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Reintentar</span>
      </button>
    </div>
  );
};
