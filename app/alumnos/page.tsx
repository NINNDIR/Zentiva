"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import { Alumno } from "@/lib/types";
import { getAlumnos } from "@/lib/firestore-service";
import { AlumnoFormView } from "@/components/alumnos/alumno-form-view";
import { AlumnoModalForm } from "@/components/alumnos/alumno-modal-form";
import { CSVImportModal } from "@/components/alumnos/csv-import-modal";
import { DeleteAlumnoModal } from "@/components/alumnos/delete-alumno-modal";
import {
  Search,
  UserPlus,
  Users,
  FileSpreadsheet,
  Filter,
  ChevronRight,
} from "lucide-react";

export default function AlumnosPage() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrado, setSelectedGrado] = useState<number | "ALL">("ALL");
  const [selectedGrupo, setSelectedGrupo] = useState<string | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ACTIVOS" | "TODOS" | "BAJAS">("ACTIVOS");

  // Selection & Modals State
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null);
  const [deletingAlumno, setDeletingAlumno] = useState<Alumno | null>(null);

  const isDirectivo = user?.role === "DIRECTIVO";

  useEffect(() => {
    loadAlumnosData();
  }, []);

  const loadAlumnosData = async () => {
    setLoading(true);
    const list = await getAlumnos();
    setAlumnos(list);
    if (list.length > 0 && !selectedAlumno) {
      setSelectedAlumno(list[0]);
    }
    setLoading(false);
  };

  const handleOpenNewModal = () => {
    setEditingAlumno(null);
    setIsFormModalOpen(true);
  };

  const handleEditAlumno = (alumno: Alumno) => {
    setEditingAlumno(alumno);
    setIsFormModalOpen(true);
  };

  const handleDeleteAlumno = (alumno: Alumno) => {
    setDeletingAlumno(alumno);
    setIsDeleteModalOpen(true);
  };

  // Filtering logic
  const filteredAlumnos = alumnos.filter((a) => {
    const matchesSearch =
      a.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.curp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.domicilio?.colonia && a.domicilio.colonia.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGrado = selectedGrado === "ALL" || a.grado === selectedGrado;
    const matchesGrupo = selectedGrupo === "ALL" || a.grupo === selectedGrupo;

    let matchesStatus = true;
    if (statusFilter === "ACTIVOS") {
      matchesStatus = a.estatus === "ACTIVO" || !a.estatus;
    } else if (statusFilter === "BAJAS") {
      matchesStatus = a.estatus === "BAJA" || a.estatus === "INACTIVO";
    }

    return matchesSearch && matchesGrado && matchesGrupo && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        
        {/* Module Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">
              <Users className="w-4 h-4 text-blue-600" />
              <span>EXPEDIENTES ESCOLARES</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Directorio de Alumnos & Contactos Oficiales
            </h1>
            <p className="text-xs text-slate-500">
              Control de expedientes reales con matrícula inmutable por serie, directorio con datos de trabajo y timeline.
            </p>
          </div>

          {!isDirectivo && (
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <button
                onClick={() => setIsCSVModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition flex items-center space-x-2 shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Carga CSV Maestro</span>
              </button>

              <button
                onClick={handleOpenNewModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition flex items-center space-x-2 shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Registro</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Instant Search Bar */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nombre, Matrícula (25-042), CURP o Colonia..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {/* Grado, Grupo & Status Filter Pills */}
          <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Grado:</span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
              {[
                { label: "Todos", val: "ALL" },
                { label: "1º (26-)", val: 1 },
                { label: "2º (25-)", val: 2 },
                { label: "3º (24-)", val: 3 },
              ].map((g) => (
                <button
                  key={String(g.val)}
                  onClick={() => setSelectedGrado(g.val as any)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    selectedGrado === g.val
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium ml-1">
              <span>Grupo:</span>
              <select
                value={selectedGrupo}
                onChange={(e) => setSelectedGrupo(e.target.value)}
                className="text-xs bg-slate-100 border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-800 focus:outline-none"
              >
                <option value="ALL">Todos</option>
                {["A", "B", "C", "D", "E", "F", "G"].map((grp) => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium ml-1">
              <span>Estatus:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-100 border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-800 focus:outline-none"
              >
                <option value="ACTIVOS">Activos</option>
                <option value="BAJAS">Bajas / Inactivos</option>
                <option value="TODOS">Todos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Grid of Students + ServiceNow Form View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Student List Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Expedientes Real ({filteredAlumnos.length})
              </span>
            </div>

            {loading ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500 font-mono">
                Cargando expedientes desde Firestore...
              </div>
            ) : filteredAlumnos.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
                <p>No se encontraron alumnos con los criterios de búsqueda.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
                {filteredAlumnos.map((alumno) => {
                  const isSelected = selectedAlumno?.matricula === alumno.matricula;
                  const tutor = alumno.contactos_oficiales.find((c) => c.es_tutor_legal);

                  return (
                    <div
                      key={alumno.matricula}
                      onClick={() => setSelectedAlumno(alumno)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-300 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                            {alumno.matricula}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {alumno.grado}º "{alumno.grupo}"
                          </span>
                          {alumno.estatus === "BAJA" && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              BAJA
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">
                          {alumno.nombre_completo}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Tutor: <span className="font-medium text-slate-700">{tutor?.nombre || "No asignado"}</span>
                        </p>
                      </div>

                      <ChevronRight className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-slate-300"}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Form View Dossier (7 Cols) */}
          <div className="lg:col-span-7">
            {selectedAlumno ? (
              <AlumnoFormView
                alumno={selectedAlumno}
                onEdit={handleEditAlumno}
                onDelete={handleDeleteAlumno}
                isDirectivo={!!isDirectivo}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs shadow-sm">
                Selecciona un alumno de la lista para desplegar su expediente completo.
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Individual Form Modal */}
      <AlumnoModalForm
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={loadAlumnosData}
        initialAlumno={editingAlumno}
      />

      {/* CSV Master Import Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImportComplete={loadAlumnosData}
      />

      {/* Delete / Deactivate Student Modal */}
      <DeleteAlumnoModal
        isOpen={isDeleteModalOpen}
        alumno={deletingAlumno}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={loadAlumnosData}
      />
    </div>
  );
}
