"use client";

import React, { useState } from "react";
import { parseCSVMaestro, generateSampleCSV, CSVImportResult } from "@/lib/csv-parser";
import { bulkImportAlumnos } from "@/lib/firestore-service";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const CSVImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [parseResult, setParseResult] = useState<CSVImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg("");
    setSuccessMsg("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const result = parseCSVMaestro(content);
        setParseResult(result);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Error al leer el archivo. Asegúrate de que sea un archivo .csv válido.");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "zentiva_plantilla_maestro.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.alumnos.length === 0) return;

    setImporting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await bulkImportAlumnos(parseResult.alumnos, parseResult.coloniasUnicas);
      setImporting(false);
      setSuccessMsg(`¡Éxito! Se han guardado ${result.count} alumnos y ${parseResult.coloniasUnicas.length} colonias correctamente en Firestore.`);
      
      setTimeout(() => {
        onImportComplete();
        onClose();
        setSuccessMsg("");
        setParseResult(null);
        setFileName("");
      }, 1800);
    } catch (err: any) {
      setImporting(false);
      const msg = err.message || "Error al conectar o guardar en Firestore";
      console.error("Error al subir a Firestore:", err);

      if (msg.includes("permission-denied") || msg.includes("Permission denied")) {
        setErrorMsg("Error de Permisos en Firestore (permission-denied). Revisa las Reglas de Seguridad en la Consola de Firebase Database para permitir lectura/escritura.");
      } else {
        setErrorMsg(`Error de Firestore: ${msg}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-bold text-base">Carga de CSV Maestro (Importación Masiva)</h2>
              <p className="text-[11px] text-slate-300">
                Encabezados Estandarizados: `C1_Nombre`, `C1_Telefono`, `C1_Lugar_Trabajo`, `C1_INE`, etc.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-800">
          
          {/* Dropzone & Sample Download Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-1">
              <span className="font-bold text-xs text-slate-900 font-mono block">
                Descargar Plantilla Oficial CSV (Con C1, C2 y C3)
              </span>
              <p className="text-xs text-slate-500">
                Plantilla estandarizada con columnas de alumno, 3 contactos y datos de trabajo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-cyan-600" />
              <span>Descargar Plantilla CSV</span>
            </button>
          </div>

          {/* File Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-8 text-center bg-white transition relative">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="font-bold text-slate-900 text-sm">
                {fileName ? fileName : "Haz clic o arrastra aquí tu archivo CSV Maestro"}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Archivos compatibles: .csv (UTF-8, delimitado por coma o punto y coma)
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-950 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Error en Importación a Firestore</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 font-bold font-mono">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Parse Result Summary */}
          {parseResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold font-mono text-cyan-800">ALUMNOS VÁLIDOS A SUBIR</span>
                  <div className="text-xl font-black text-cyan-950">{parseResult.alumnos.length}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold font-mono text-emerald-800">COLONIAS DETECTADAS</span>
                  <div className="text-xl font-black text-emerald-950">{parseResult.coloniasUnicas.length}</div>
                </div>
                <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold font-mono text-slate-600">CURPs DUPLICADAS / OMITIDAS</span>
                  <div className="text-xl font-black text-slate-800">{parseResult.errores.length}</div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold font-mono text-slate-700 block">
                  Previsualización de Registros a Escribir en Firestore (Primeros 5 de {parseResult.alumnos.length}):
                </span>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-900 text-white font-mono text-[11px]">
                      <tr>
                        <th className="p-2.5">Matrícula (Doc ID)</th>
                        <th className="p-2.5">CURP</th>
                        <th className="p-2.5">Nombre Completo</th>
                        <th className="p-2.5">Grado / Grupo</th>
                        <th className="p-2.5">C1 Tutor Principal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {parseResult.alumnos.slice(0, 5).map((a) => (
                        <tr key={a.matricula} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-cyan-700">{a.matricula}</td>
                          <td className="p-2.5 font-mono text-slate-600">{a.curp}</td>
                          <td className="p-2.5 font-bold text-slate-900">{a.nombre_completo}</td>
                          <td className="p-2.5 font-mono">{a.grado}º "{a.grupo}"</td>
                          <td className="p-2.5 font-semibold text-slate-800">
                            {a.contactos_oficiales[0]?.nombre || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={importing || !parseResult || parseResult.alumnos.length === 0}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-md disabled:opacity-50"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>{importing ? "Guardando en Cloud Firestore..." : `Confirmar E Inserción en Firestore (${parseResult?.alumnos.length || 0})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
