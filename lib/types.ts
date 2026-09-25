export type UserRole = 'SUPER_USUARIO' | 'TRABAJADORA_SOCIAL' | 'DIRECTIVO';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  cargo: string;
  plantel: string;
  avatarUrl?: string;
}

export interface DemoAccount {
  role: UserRole;
  email: string;
  name: string;
  cargo: string;
  badgeColor: string;
  description: string;
}

export const OFFICIAL_PLANTEL = "Secundaria Felipe Carrillo Puerto";

export const DEMO_USERS: Record<UserRole, DemoAccount> = {
  SUPER_USUARIO: {
    role: 'SUPER_USUARIO',
    email: 'admin@zentiva.edu.mx',
    name: 'Ing. Carlos Mendoza (SU)',
    cargo: 'Administrador de Sistema Escolar',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Control total del sistema, gestión de cuentas, catálogos y logs de auditoría.',
  },
  TRABAJADORA_SOCIAL: {
    role: 'TRABAJADORA_SOCIAL',
    email: 'michausrochamariadejesus@gmail.com',
    name: 'María de Jesús Michaus Rocha',
    cargo: 'Trabajadora Social Principal',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Operativo completo: incidentes, expedientes, retardos, notas confidenciales y reportes legales PDF.',
  },
  DIRECTIVO: {
    role: 'DIRECTIVO',
    email: 'directivo@zentiva.edu.mx',
    name: 'Mtro. Roberto Hernández',
    cargo: 'Director Escolar',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Consulta de dashboards y estadísticas ejecutivas. Sin acceso a notas confidenciales ni escritura.',
  },
};

// MÓDULO 1 TYPES
export interface ContactoOficial {
  id?: string;
  prioridad: 1 | 2 | 3;
  es_tutor_legal: boolean;
  nombre: string;
  parentesco: string;
  telefono: string;
  lugar_trabajo?: string;
  telefono_trabajo?: string;
  ine_folio?: string;
  ine_url?: string;
}

export interface Domicilio {
  calle_numero: string;
  colonia: string;
  colonia_id?: string;
  colonia_otro?: boolean;
  colonia_pendiente_revision?: boolean;
}

export interface ColoniaCatalog {
  id: string;
  nombre: string;
  codigo_postal?: string;
  municipio?: string;
  activa: boolean;
  pendiente_revision?: boolean;
  creada_por_usuario?: boolean;
}

export type Colonia = ColoniaCatalog;

export interface Alumno {
  matricula: string;
  curp: string;
  nombre_completo: string;
  nombres?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  grado: 1 | 2 | 3;
  grupo: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  no_lista: number;
  turno: 'MATUTINO' | 'VESPERTINO';
  fecha_nacimiento: string;
  sexo: 'M' | 'F';
  domicilio: Domicilio;
  contactos_oficiales: ContactoOficial[];
  estatus: 'ACTIVO' | 'INACTIVO' | 'BAJA';
  creado_el?: string;
}

export function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return Math.max(0, edad);
}

export function generarMatriculaPorGrado(grado: 1 | 2 | 3, consecutivo: number): string {
  const serie = grado === 3 ? "24" : grado === 2 ? "25" : "26";
  const numStr = consecutivo.toString().padStart(3, "0");
  return `${serie}-${numStr}`;
}

export type CategoriaNota = 
  | 'FAMILIAR' 
  | 'ACADÉMICO' 
  | 'CONDUCTUAL' 
  | 'SALUD' 
  | 'VULNERABILIDAD' 
  | 'OTRO';

export interface NotaConfidencial {
  id: string;
  alumno_matricula: string;
  fecha: string;
  autor_uid: string;
  autor_nombre: string;
  autor_cargo: string;
  contenido: string;
  categoria: CategoriaNota;
}

// ---------------- MÓDULO 2 & 3: INCIDENTES, CATÁLOGO, SLAS, EVENTOS RÁPIDOS Y AUDITORÍA ----------------

export type SeveridadFalta = 'LEVE' | 'MODERADA' | 'GRAVE' | 'SEVERA';

export interface FaltaCatalog {
  id: string;
  nombre_falta: string;
  categoria: 'DISCIPLINARIA' | 'ASISTENCIA' | 'BULLYING' | 'ACADÉMICA' | 'VANDALISMO' | 'OTRA';
  severidad_defecto: SeveridadFalta;
  dias_suspension_defecto: number;
  requiere_citatorio_defecto: boolean;
  activa: boolean;
}

export type RolImplicado = 'AGRESOR' | 'VÍCTIMA' | 'TESTIGO';

export interface ImplicadoIncidente {
  alumno_matricula: string;
  nombre_completo: string;
  grado: number;
  grupo: string;
  rol_implicado: RolImplicado;
}

export type EstatusIncidente = 'ABIERTO' | 'EN PROCESO' | 'CERRADO';

export interface Incidente {
  id: string;
  folio: string; // ej. "INC-2026-0042"
  fecha_hora: string; // Formato YYYY-MM-DD HH:mm
  falta_id: string;
  falta_nombre: string;
  categoria: string;
  severidad: SeveridadFalta;
  implicados: ImplicadoIncidente[];
  descripcion_hechos: string;
  estatus: EstatusIncidente;
  dias_suspension: number;
  fecha_fin_suspension?: string; // YYYY-MM-DD
  reincorporacion_fecha?: string; // YYYY-MM-DD (Siguiente día hábil)
  requiere_citatorio: boolean;
  citatorio_fecha_hora?: string;
  tutor_notificado: boolean;
  firma_escaneada_adjunta: boolean;
  creado_por_uid: string;
  creado_por_nombre: string;
  creado_el: string;
}

export interface AnexoComentario {
  id: string;
  incidente_id: string;
  usuario_uid: string;
  usuario_nombre: string;
  usuario_cargo: string;
  fecha_hora: string; // "DD/MM/YYYY - HH:mm"
  comentario: string;
}

export interface AuditLogEntry {
  id: string;
  incidente_id: string;
  fecha_hora: string;
  usuario_id: string;
  usuario_nombre: string;
  campos_modificados: string[];
  valor_anterior: Record<string, any>;
  valor_nuevo: Record<string, any>;
}

export interface EventoRapido {
  id: string;
  tipo: 'PASE_SALIDA' | 'RETARDO_MASIVO';
  alumno_matricula: string;
  alumno_nombre: string;
  grado_grupo: string;
  fecha_hora: string; // YYYY-MM-DD HH:mm
  quien_retira_nombre?: string;
  quien_retira_parentesco?: string;
  medio_autorizacion?: string; // "Llamada a Tutor Principal", "Presencial", etc.
  ine_folio?: string;
  ine_fisica_resguardada?: boolean; // Checkbox obligatorio
  motivo?: string;
  registrado_por: string;
}

export interface SalidaExtraordinaria {
  id: string;
  alumno_matricula: string;
  alumno_nombre: string;
  grado_grupo: string;
  fecha_hora: string; // YYYY-MM-DD HH:mm
  tipo_visitante: 'CONTACTO_REGISTRADO' | 'CUARTO_VISITANTE';
  contacto_oficial_id?: string;
  quien_retira_nombre: string;
  quien_retira_parentesco: string;
  ine_folio: string;
  medio_autorizacion: string;
  motivo: string;
  validacion_ine_fisica_confirmada: boolean;
  registrado_por_uid?: string;
  registrado_por_nombre: string;
  creado_el?: string;
}

export interface RetardoRecord {
  id: string;
  alumno_matricula: string;
  alumno_nombre: string;
  grado: number;
  grupo: string;
  grado_grupo: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  fecha_hora: string; // YYYY-MM-DD HH:mm
  motivo: string;
  es_masivo?: boolean;
  registrado_por_uid?: string;
  registrado_por_nombre: string;
  creado_el?: string;
}

export interface JustificanteMedico {
  id: string;
  folio: string; // ej. JUST-2026-0001
  alumno_matricula: string;
  alumno_nombre: string;
  grado_grupo: string;
  fecha_emision: string; // YYYY-MM-DD
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  dias_totales: number;
  motivo_medico: string;
  institucion_medica?: string;
  medico_nombre?: string;
  observaciones?: string;
  registrado_por_uid?: string;
  registrado_por_nombre: string;
  creado_el?: string;
}

export type EstatusCanalizacion = 'PENDIENTE' | 'EN_PROCESO' | 'ATENDIDO' | 'FINALIZADO';

export interface CanalizacionExterna {
  id: string;
  folio: string; // ej. CANAL-2026-0001
  alumno_matricula: string;
  alumno_nombre: string;
  grado_grupo: string;
  fecha_canalizacion: string; // YYYY-MM-DD
  institucion_destino: string; // DIF, USAER, Salud Mental, CAPEP, etc.
  motivo_canalizacion: string;
  estatus: EstatusCanalizacion;
  tutor_notificado: boolean;
  observaciones_seguimiento?: string;
  registrado_por_uid?: string;
  registrado_por_nombre: string;
  creado_el?: string;
}

export interface InstitucionCanalizacionCatalog {
  id: string;
  nombre: string;
  tipo: 'DIF' | 'USAER' | 'SALUD_MENTAL' | 'CAPEP' | 'TRABAJO_SOCIAL_EXTERNO' | 'PANNARTI' | 'PROCURADURÍA' | 'OTRA';
  telefono?: string;
  direccion?: string;
  contacto_principal?: string;
  activa: boolean;
}

export type TipoEventoTimeline = 'INCIDENTE_GRAVE' | 'RETARDO' | 'CANALIZACIÓN' | 'NOTA' | 'PASE_SALIDA' | 'JUSTIFICANTE';

export interface EventoTimeline {
  id: string;
  alumno_matricula: string;
  fecha: string;
  tipo: TipoEventoTimeline;
  titulo: string;
  descripcion: string;
  autor: string;
}

// Función auxiliar para calcular el siguiente día hábil sumando días de suspensión
export function calcularFechaReincorporacion(fechaEvento: string, diasSuspension: number): { fechaFin: string; fechaRegreso: string } {
  const base = fechaEvento ? new Date(fechaEvento) : new Date();
  if (isNaN(base.getTime())) {
    const today = new Date();
    return {
      fechaFin: today.toISOString().split("T")[0],
      fechaRegreso: today.toISOString().split("T")[0],
    };
  }

  let curr = new Date(base);
  let addedDays = 0;

  // Sumar días de suspensión saltando fines de semana
  while (addedDays < diasSuspension) {
    curr.setDate(curr.getDate() + 1);
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }

  const fechaFin = curr.toISOString().split("T")[0];

  // Siguiente día hábil para reincorporación
  let regreso = new Date(curr);
  regreso.setDate(regreso.getDate() + 1);
  while (regreso.getDay() === 0 || regreso.getDay() === 6) {
    regreso.setDate(regreso.getDate() + 1);
  }

  const fechaRegreso = regreso.toISOString().split("T")[0];

  return { fechaFin, fechaRegreso };
}

// Helper para calcular la semaforización de SLA
export function obtenerSLAInfo(fechaHoraIncidente: string, estatus: EstatusIncidente, tieneFirma: boolean): { color: 'VERDE' | 'AMARILLO' | 'ROJO'; label: string; badgeClass: string } {
  if (estatus === "CERRADO" && tieneFirma) {
    return {
      color: "VERDE",
      label: "Cerrado y Firmado",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
    };
  }

  const incDate = new Date(fechaHoraIncidente);
  if (isNaN(incDate.getTime())) {
    return { color: "VERDE", label: "< 24h", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium" };
  }

  const now = new Date();
  const diffHours = Math.abs(now.getTime() - incDate.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return {
      color: "VERDE",
      label: `< 24h (${Math.round(diffHours)}h)`,
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
    };
  } else if (diffHours >= 24 && diffHours <= 48) {
    return {
      color: "AMARILLO",
      label: `24-48h (${Math.round(diffHours)}h)`,
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
    };
  } else {
    return {
      color: "ROJO",
      label: `> 48h SLA Vencido (${Math.round(diffHours)}h)`,
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
    };
  }
}
