"use client";

import React, { useState, useEffect } from "react";
import {
  ColoniaCatalog,
  FaltaCatalog,
  InstitucionCanalizacionCatalog,
  UserProfile,
  UserRole,
  SeveridadFalta,
  OFFICIAL_PLANTEL,
} from "@/lib/types";
import {
  getColonias,
  saveColoniaCatalog,
  deleteColoniaCatalog,
  getFaltasCatalog,
  saveFaltaCatalog,
  deleteFaltaCatalog,
  getInstitucionesCanalizacionCatalog,
  saveInstitucionCanalizacionCatalog,
  deleteInstitucionCanalizacionCatalog,
  getUsers,
  saveUserProfile,
  deleteUserProfile,
} from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth-context";
import {
  ShieldCheck,
  Building,
  Sparkles,
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
} from "lucide-react";

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"COLONIAS" | "FALTAS" | "INSTITUCIONES" | "USUARIOS">("COLONIAS");
  const [loading, setLoading] = useState(true);

  // Data states
  const [colonias, setColonias] = useState<ColoniaCatalog[]>([]);
  const [faltas, setFaltas] = useState<FaltaCatalog[]>([]);
  const [instituciones, setInstituciones] = useState<InstitucionCanalizacionCatalog[]>([]);
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isColoniaModalOpen, setIsColoniaModalOpen] = useState(false);
  const [editingColonia, setEditingColonia] = useState<ColoniaCatalog | null>(null);

  const [isFaltaModalOpen, setIsFaltaModalOpen] = useState(false);
  const [editingFalta, setEditingFalta] = useState<FaltaCatalog | null>(null);

  const [isInstModalOpen, setIsInstModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<InstitucionCanalizacionCatalog | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [colList, falList, instList, usrList] = await Promise.all([
        getColonias(),
        getFaltasCatalog(),
        getInstitucionesCanalizacionCatalog(),
        getUsers(),
      ]);
      setColonias(colList);
      setFaltas(falList);
      setInstituciones(instList);
      setUsuarios(usrList);
    } catch (err) {
      console.error("Error al cargar datos del panel de administración:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (!user || user.role !== "SUPER_USUARIO") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-xl text-center max-w-md space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Acceso Restringido</h2>
          <p className="text-xs text-slate-600">
            Esta sección es exclusiva para la gestión de catálogos y usuarios del <strong>Super Usuario / Administrador del Sistema</strong>.
          </p>
        </div>
      </div>
    );
  }

  // --- HANDLERS: COLONIAS ---
  const handleSaveColonia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = (formData.get("nombre") as string).trim();
    if (!nombre) return;

    const id = editingColonia?.id || `col_${nombre.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
    await saveColoniaCatalog({
      id,
      nombre: nombre.toUpperCase(),
      codigo_postal: (formData.get("codigo_postal") as string) || "",
      municipio: (formData.get("municipio") as string) || "Querétaro",
      activa: formData.get("activa") === "on",
      pendiente_revision: false,
    });
    setIsColoniaModalOpen(false);
    loadAllData();
  };

  const handleDeleteColonia = async (id: string, nombre: string) => {
    if (confirm(`¿Eliminar la colonia "${nombre}" de Firestore?`)) {
      await deleteColoniaCatalog(id);
      loadAllData();
    }
  };

  // --- HANDLERS: FALTAS ---
  const handleSaveFalta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre_falta = (formData.get("nombre_falta") as string).trim();
    if (!nombre_falta) return;

    const id = editingFalta?.id || `falta-${Date.now()}`;
    await saveFaltaCatalog({
      id,
      nombre_falta,
      categoria: formData.get("categoria") as any,
      severidad_defecto: formData.get("severidad_defecto") as SeveridadFalta,
      dias_suspension_defecto: Number(formData.get("dias_suspension_defecto") || 0),
      requiere_citatorio_defecto: formData.get("requiere_citatorio_defecto") === "on",
      activa: formData.get("activa") === "on",
    });
    setIsFaltaModalOpen(false);
    loadAllData();
  };

  const handleDeleteFalta = async (id: string, nombre: string) => {
    if (confirm(`¿Eliminar la falta "${nombre}" del catálogo en Firestore?`)) {
      await deleteFaltaCatalog(id);
      loadAllData();
    }
  };

  // --- HANDLERS: INSTITUCIONES ---
  const handleSaveInst = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = (formData.get("nombre") as string).trim();
    if (!nombre) return;

    const id = editingInst?.id || `inst-${Date.now()}`;
    await saveInstitucionCanalizacionCatalog({
      id,
      nombre,
      tipo: formData.get("tipo") as any,
      telefono: (formData.get("telefono") as string) || "",
      direccion: (formData.get("direccion") as string) || "",
      contacto_principal: (formData.get("contacto_principal") as string) || "",
      activa: formData.get("activa") === "on",
    });
    setIsInstModalOpen(false);
    loadAllData();
  };

  const handleDeleteInst = async (id: string, nombre: string) => {
    if (confirm(`¿Eliminar la institución "${nombre}" de Firestore?`)) {
      await deleteInstitucionCanalizacionCatalog(id);
      loadAllData();
    }
  };

  // --- HANDLERS: USUARIOS ---
  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim().toLowerCase();
    const displayName = (formData.get("displayName") as string).trim();
    if (!email || !displayName) return;

    const uid = editingUser?.uid || `usr_${Date.now()}`;
    await saveUserProfile({
      uid,
      email,
      displayName,
      role: formData.get("role") as UserRole,
      cargo: (formData.get("cargo") as string) || "Personal Escolar",
      plantel: OFFICIAL_PLANTEL,
    });
    setIsUserModalOpen(false);
    loadAllData();
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (confirm(`¿Eliminar la cuenta de usuario (${email}) en Firestore?`)) {
      await deleteUserProfile(uid);
      loadAllData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider block">
                Panel de Administración Central (Super Usuario)
              </span>
              <h1 className="text-2xl font-black tracking-tight mt-0.5">
                Gestión de Catálogos & Usuarios en Firestore
              </h1>
              <p className="text-xs text-slate-300">
                Administración de la Secundaria Felipe Carrillo Puerto y parametrización de reglas de negocio.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-300 bg-white p-2 rounded-xl border shadow-sm space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("COLONIAS")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "COLONIAS"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Catálogo Colonias ({colonias.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("FALTAS")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "FALTAS"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Catálogo Faltas ({faltas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("INSTITUCIONES")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "INSTITUCIONES"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Instituciones Canalización ({instituciones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("USUARIOS")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "USUARIOS"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios & Roles ({usuarios.length})</span>
          </button>
        </div>

        {/* TAB 1: COLONIAS */}
        {activeTab === "COLONIAS" && (
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Catálogo de Colonias Escolar (`cat_colonias`)
                </h3>
                <p className="text-xs text-slate-600">
                  Incluye colonias validadas y marcadores pendientes creados por selección "Otro".
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingColonia(null);
                  setIsColoniaModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Colonia</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-5">Nombre Colonia</th>
                    <th className="py-3 px-5">Código Postal</th>
                    <th className="py-3 px-5">Municipio</th>
                    <th className="py-3 px-5 text-center font-bold">Estado en Sistema</th>
                    <th className="py-3 px-5 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {colonias.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2">
                        {c.nombre}
                        {c.pendiente_revision && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                            Pendiente Revisión SysAdmin
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">{c.codigo_postal || "N/A"}</td>
                      <td className="py-3.5 px-5 text-slate-700">{c.municipio || "Querétaro"}</td>
                      <td className="py-3.5 px-5 text-center">
                        {c.activa ? (
                          <span className="inline-flex items-center text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400 text-[10px]">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Inactiva
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingColonia(c);
                            setIsColoniaModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-950 rounded hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteColonia(c.id, c.nombre)}
                          className="p-1.5 text-rose-600 hover:text-rose-900 rounded hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: FALTAS */}
        {activeTab === "FALTAS" && (
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Catálogo Configurable de Faltas & Sanciones (`cat_faltas`)
                </h3>
                <p className="text-xs text-slate-600">
                  Parametrización de severidades y días de suspensión por defecto.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingFalta(null);
                  setIsFaltaModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Falta</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-5">Falta / Conducta</th>
                    <th className="py-3 px-5">Categoría</th>
                    <th className="py-3 px-5">Severidad Defecto</th>
                    <th className="py-3 px-5 text-center">Días Suspensión</th>
                    <th className="py-3 px-5 text-center">Citatorio</th>
                    <th className="py-3 px-5 text-center">Estado</th>
                    <th className="py-3 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {faltas.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{f.nombre_falta}</td>
                      <td className="py-3.5 px-5">
                        <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-[10px] border border-slate-200 font-bold">
                          {f.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold">
                        <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                          {f.severidad_defecto}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-800">
                        {f.dias_suspension_defecto} día(s)
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold">
                        {f.requiere_citatorio_defecto ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] border border-blue-200">
                            Sí Requiere
                          </span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {f.activa ? (
                          <span className="inline-flex items-center text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400 text-[10px]">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Inactiva
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingFalta(f);
                            setIsFaltaModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-950 rounded hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFalta(f.id, f.nombre_falta)}
                          className="p-1.5 text-rose-600 hover:text-rose-900 rounded hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INSTITUCIONES DE CANALIZACIÓN */}
        {activeTab === "INSTITUCIONES" && (
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Catálogo de Instituciones Externa (`cat_instituciones_canalizacion`)
                </h3>
                <p className="text-xs text-slate-600">
                  Directorio de dependencias autorizadas para canalización institucional.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingInst(null);
                  setIsInstModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Institución</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-5">Nombre Institución</th>
                    <th className="py-3 px-5">Tipo / Categoría</th>
                    <th className="py-3 px-5">Teléfono / Contacto</th>
                    <th className="py-3 px-5 text-center">Estado</th>
                    <th className="py-3 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {instituciones.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{inst.nombre}</td>
                      <td className="py-3.5 px-5 font-mono text-sky-800 font-bold text-[11px]">
                        {inst.tipo}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">{inst.telefono || "N/A"}</td>
                      <td className="py-3.5 px-5 text-center">
                        {inst.activa ? (
                          <span className="inline-flex items-center text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400 text-[10px]">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Inactiva
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingInst(inst);
                            setIsInstModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-950 rounded hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInst(inst.id, inst.nombre)}
                          className="p-1.5 text-rose-600 hover:text-rose-900 rounded hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USUARIOS Y ROLES */}
        {activeTab === "USUARIOS" && (
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Gestión de Cuentas y Roles de Usuario (`usuarios`)
                </h3>
                <p className="text-xs text-slate-600">
                  Asignación de privilegios para Super Usuario, Trabajadora Social y Directivos.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsUserModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Usuario</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-5">Nombre Usuario</th>
                    <th className="py-3 px-5">Correo Electrónico</th>
                    <th className="py-3 px-5">Rol de Sistema</th>
                    <th className="py-3 px-5">Cargo Oficial</th>
                    <th className="py-3 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{u.displayName}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-700">{u.email}</td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            u.role === "SUPER_USUARIO"
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : u.role === "TRABAJADORA_SOCIAL"
                              ? "bg-cyan-100 text-cyan-800 border-cyan-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700">{u.cargo}</td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setIsUserModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-950 rounded hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.uid, u.email)}
                          className="p-1.5 text-rose-600 hover:text-rose-900 rounded hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MODALS FOR CREATING / EDITING --- */}
        {/* COLONIA MODAL */}
        {isColoniaModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {editingColonia ? "Editar Colonia" : "Agregar Nueva Colonia"}
              </h3>
              <form onSubmit={handleSaveColonia} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre de la Colonia</label>
                  <input
                    name="nombre"
                    defaultValue={editingColonia?.nombre || ""}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código Postal (Opcional)</label>
                  <input
                    name="codigo_postal"
                    defaultValue={editingColonia?.codigo_postal || ""}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Municipio</label>
                  <input
                    name="municipio"
                    defaultValue={editingColonia?.municipio || "Querétaro"}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="activaCol"
                    name="activa"
                    defaultChecked={editingColonia ? editingColonia.activa : true}
                    className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="activaCol" className="font-bold text-slate-800 cursor-pointer">
                    Colonia Activa en catálogo
                  </label>
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsColoniaModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-sm hover:bg-purple-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FALTA MODAL */}
        {isFaltaModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-lg w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {editingFalta ? "Editar Falta del Catálogo" : "Agregar Nueva Falta"}
              </h3>
              <form onSubmit={handleSaveFalta} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre / Descripción de la Falta</label>
                  <input
                    name="nombre_falta"
                    defaultValue={editingFalta?.nombre_falta || ""}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                    <select
                      name="categoria"
                      defaultValue={editingFalta?.categoria || "DISCIPLINARIA"}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="DISCIPLINARIA">DISCIPLINARIA</option>
                      <option value="ASISTENCIA">ASISTENCIA</option>
                      <option value="BULLYING">BULLYING</option>
                      <option value="ACADÉMICA">ACADÉMICA</option>
                      <option value="VANDALISMO">VANDALISMO</option>
                      <option value="OTRA">OTRA</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Severidad por Defecto</label>
                    <select
                      name="severidad_defecto"
                      defaultValue={editingFalta?.severidad_defecto || "LEVE"}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="LEVE">LEVE</option>
                      <option value="MODERADA">MODERADA</option>
                      <option value="GRAVE">GRAVE</option>
                      <option value="SEVERA">SEVERA</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Días Suspensión Defecto</label>
                    <input
                      type="number"
                      name="dias_suspension_defecto"
                      defaultValue={editingFalta?.dias_suspension_defecto || 0}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div className="flex flex-col justify-end space-y-2">
                    <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        name="requiere_citatorio_defecto"
                        defaultChecked={editingFalta ? editingFalta.requiere_citatorio_defecto : true}
                        className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span>Requiere Citatorio</span>
                    </label>
                    <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        name="activa"
                        defaultChecked={editingFalta ? editingFalta.activa : true}
                        className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span>Falta Activa</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFaltaModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-sm hover:bg-purple-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* INSTITUCION MODAL */}
        {isInstModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {editingInst ? "Editar Institución" : "Agregar Institución de Canalización"}
              </h3>
              <form onSubmit={handleSaveInst} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre de la Institución</label>
                  <input
                    name="nombre"
                    defaultValue={editingInst?.nombre || ""}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo / Categoría</label>
                  <select
                    name="tipo"
                    defaultValue={editingInst?.tipo || "DIF"}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="DIF">DIF</option>
                    <option value="USAER">USAER</option>
                    <option value="SALUD_MENTAL">SALUD MENTAL</option>
                    <option value="CAPEP">CAPEP</option>
                    <option value="TRABAJO_SOCIAL_EXTERNO">TRABAJO SOCIAL EXTERNO</option>
                    <option value="PANNARTI">PANNARTI</option>
                    <option value="PROCURADURÍA">PROCURADURÍA</option>
                    <option value="OTRA">OTRA</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono Directo (Opcional)</label>
                  <input
                    name="telefono"
                    defaultValue={editingInst?.telefono || ""}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="activaInst"
                    name="activa"
                    defaultChecked={editingInst ? editingInst.activa : true}
                    className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="activaInst" className="font-bold text-slate-800 cursor-pointer">
                    Institución Activa
                  </label>
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsInstModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-sm hover:bg-purple-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* USER MODAL */}
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {editingUser ? "Editar Usuario y Rol" : "Registrar Nuevo Usuario"}
              </h3>
              <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre Completo</label>
                  <input
                    name="displayName"
                    defaultValue={editingUser?.displayName || ""}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser?.email || ""}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rol de Sistema</label>
                  <select
                    name="role"
                    defaultValue={editingUser?.role || "TRABAJADORA_SOCIAL"}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="SUPER_USUARIO">SUPER USUARIO (Admin Total)</option>
                    <option value="TRABAJADORA_SOCIAL">TRABAJADORA SOCIAL (Operativo)</option>
                    <option value="DIRECTIVO">DIRECTIVO (Consulta Exec / Dashboards)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cargo Oficial</label>
                  <input
                    name="cargo"
                    defaultValue={editingUser?.cargo || "Personal Escolar"}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-sm hover:bg-purple-700"
                  >
                    Guardar
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
