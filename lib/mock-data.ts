import { Alumno, Colonia, NotaConfidencial, EventoTimeline, FaltaCatalog, Incidente, EventoRapido } from "./types";

export const INITIAL_COLONIAS: Colonia[] = [
  { id: "col_felipe_carrillo_puerto", nombre: "FELIPE CARRILLO PUERTO", codigo_postal: "76138", municipio: "Querétaro" },
  { id: "col_satelite", nombre: "SATÉLITE", codigo_postal: "76110", municipio: "Querétaro" },
  { id: "col_centro_historico", nombre: "CENTRO HISTÓRICO", codigo_postal: "76000", municipio: "Querétaro" },
];

export const INITIAL_ALUMNOS: Alumno[] = [
  {
    matricula: "25-042",
    curp: "AOCN131222MQTRSA9",
    nombre_completo: "ACOSTA CRUZ NASHLA MAHELY",
    nombres: "NASHLA MAHELY",
    primer_apellido: "ACOSTA",
    segundo_apellido: "CRUZ",
    grado: 2,
    grupo: "G",
    no_lista: 1,
    turno: "MATUTINO",
    fecha_nacimiento: "2013-12-22",
    sexo: "F",
    domicilio: {
      calle_numero: "NIÑOS HEROES NO. 13",
      colonia: "FELIPE CARRILLO PUERTO",
    },
    contactos_oficiales: [
      {
        id: "c1",
        prioridad: 1,
        es_tutor_legal: true,
        nombre: "MARIA CRUZ FUENTES",
        parentesco: "Madre",
        telefono: "4428368526",
        lugar_trabajo: "Comercializadora del Bajío S.A.",
        telefono_trabajo: "4422110099",
        ine_folio: "IDMEX1234567890",
      },
      {
        id: "c2",
        prioridad: 2,
        es_tutor_legal: false,
        nombre: "ROBERTO ACOSTA HERNÁNDEZ",
        parentesco: "Padre",
        telefono: "4421987654",
        lugar_trabajo: "Talleres Industriales Querétaro",
        telefono_trabajo: "4423334455",
      },
      {
        id: "c3",
        prioridad: 3,
        es_tutor_legal: false,
        nombre: "CARMEN FUENTES LÓPEZ",
        parentesco: "Abuela Materna",
        telefono: "4425551234",
        lugar_trabajo: "Hogar",
      },
    ],
    estatus: "ACTIVO",
    creado_el: "2025-08-20T08:00:00Z",
  },
];

export const INITIAL_NOTAS: Record<string, NotaConfidencial[]> = {
  "25-042": [
    {
      id: "n1",
      alumno_matricula: "25-042",
      fecha: "2026-09-10 10:30 AM",
      autor_uid: "ts-01",
      autor_nombre: "María de Jesús Michaus Rocha",
      autor_cargo: "Trabajadora Social Principal",
      categoria: "FAMILIAR",
      contenido: "Entrevista inicial con la madre (Sra. María Cruz). Reporta buena comunicación en casa y compromiso con el envío puntual de tareas.",
    },
  ],
};

export const INITIAL_EVENTS: EventoTimeline[] = [
  {
    id: "evt-1",
    alumno_matricula: "25-042",
    fecha: "2026-09-11 07:45 AM",
    tipo: "RETARDO",
    titulo: "Retardo de Asistencia",
    descripcion: "Llegada al plantel a las 07:45 AM (tolerancia 07:30 AM). Motivo reportado por la alumna: tráfico severo en Av. 5 de Febrero.",
    autor: "Prefectura / Trabajo Social",
  },
  {
    id: "evt-2",
    alumno_matricula: "25-042",
    fecha: "2026-09-08 11:20 AM",
    tipo: "CANALIZACIÓN",
    titulo: "Canalización Interna a Psicología Escolar",
    descripcion: "Se envía solicitud de acompañamiento socioemocional a USAER / Psicología preventiva para seguimiento académico.",
    autor: "María de Jesús Michaus Rocha",
  },
  {
    id: "evt-3",
    alumno_matricula: "25-042",
    fecha: "2026-09-02 09:15 AM",
    tipo: "INCIDENTE_GRAVE",
    titulo: "Reporte de Incidente Disciplinario",
    descripcion: "Falta menor: Uso de teléfono celular durante la clase de Historia. Se firma carta compromiso con el tutor legal.",
    autor: "Trabajo Social",
  },
];

export const INITIAL_FALTAS: FaltaCatalog[] = [
  {
    id: "falta-01",
    nombre_falta: "Uso indebido de celular / dispositivo electrónico",
    categoria: "DISCIPLINARIA",
    severidad_defecto: "LEVE",
    dias_suspension_defecto: 0,
    requiere_citatorio_defecto: true,
    activa: true,
  },
  {
    id: "falta-02",
    nombre_falta: "Inasistencia injustificada a clase / Salida del aula sin permiso",
    categoria: "ASISTENCIA",
    severidad_defecto: "MODERADA",
    dias_suspension_defecto: 1,
    requiere_citatorio_defecto: true,
    activa: true,
  },
  {
    id: "falta-03",
    nombre_falta: "Agresión verbal, acoso escolar o bullying entre alumnos",
    categoria: "BULLYING",
    severidad_defecto: "GRAVE",
    dias_suspension_defecto: 3,
    requiere_citatorio_defecto: true,
    activa: true,
  },
  {
    id: "falta-04",
    nombre_falta: "Vandalismo o daño a instalaciones/mobiliario escolar",
    categoria: "VANDALISMO",
    severidad_defecto: "SEVERA",
    dias_suspension_defecto: 5,
    requiere_citatorio_defecto: true,
    activa: true,
  },
  {
    id: "falta-05",
    nombre_falta: "Agresión física directa en el plantel",
    categoria: "DISCIPLINARIA",
    severidad_defecto: "SEVERA",
    dias_suspension_defecto: 5,
    requiere_citatorio_defecto: true,
    activa: true,
  },
];

export const INITIAL_INCIDENTES: Incidente[] = [
  {
    id: "inc-2026-001",
    folio: "INC-2026-0001",
    fecha_hora: "2026-09-15 08:30",
    falta_id: "falta-03",
    falta_nombre: "Agresión verbal, acoso escolar o bullying entre alumnos",
    categoria: "BULLYING",
    severidad: "GRAVE",
    implicados: [
      {
        alumno_matricula: "25-042",
        nombre_completo: "ACOSTA CRUZ NASHLA MAHELY",
        grado: 2,
        grupo: "G",
        rol_implicado: "VÍCTIMA",
      },
    ],
    descripcion_hechos: "Reporte presentado por el docente de Formación Cívica sobre altercado en patio central.",
    estatus: "ABIERTO",
    dias_suspension: 3,
    fecha_fin_suspension: "2026-09-18",
    reincorporacion_fecha: "2026-09-21",
    requiere_citatorio: true,
    citatorio_fecha_hora: "2026-09-17 10:00",
    tutor_notificado: true,
    firma_escaneada_adjunta: false,
    creado_por_uid: "ts-01",
    creado_por_nombre: "María de Jesús Michaus Rocha",
    creado_el: "2026-09-15T08:30:00Z",
  },
];

export const INITIAL_EVENTOS_RAPIDOS: EventoRapido[] = [
  {
    id: "ev-001",
    tipo: "PASE_SALIDA",
    alumno_matricula: "25-042",
    alumno_nombre: "ACOSTA CRUZ NASHLA MAHELY",
    grado_grupo: "2° G",
    fecha_hora: "2026-09-14 11:30",
    quien_retira_nombre: "MARIA CRUZ FUENTES",
    quien_retira_parentesco: "Madre",
    medio_autorizacion: "Presencial con INE",
    ine_folio: "IDMEX1234567890",
    ine_fisica_resguardada: true,
    motivo: "Cita médica familiar programada",
    registrado_por: "María de Jesús Michaus Rocha",
  },
];

