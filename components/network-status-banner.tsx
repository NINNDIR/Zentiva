"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export const NetworkStatusBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleBackendIssue = (event: Event) => {
      const detail = (event as CustomEvent<{ available: boolean }>).detail;
      setBackendUnavailable(!detail?.available);
    };

    // Initial check
    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("zentiva:backend-connection", handleBackendIssue);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("zentiva:backend-connection", handleBackendIssue);
    };
  }, []);

  if (!isOffline && !backendUnavailable) return null;

  return (
    <div role="alert" className="fixed top-0 left-0 right-0 z-[80] bg-rose-700 text-white px-4 py-2.5 shadow-lg border-b border-rose-800 flex items-center justify-center space-x-2.5 text-xs font-bold tracking-wide font-sans animate-in slide-in-from-top duration-300">
      <div className="w-6 h-6 rounded-full bg-amber-950/20 flex items-center justify-center flex-shrink-0 text-slate-950">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <span>
        {isOffline ? "Sin conexión a internet. Los registros no se guardarán hasta recuperar la red." : "No se pudo conectar con Firebase. Revisa la conexión antes de volver a guardar."}
      </span>
      <button
        onClick={() => window.location.reload()}
        className="ml-2 px-2.5 py-1 bg-white text-rose-800 rounded-lg text-[10px] font-bold hover:bg-rose-50 transition flex items-center space-x-1 cursor-pointer flex-shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Reintentar</span>
      </button>
    </div>
  );
};
