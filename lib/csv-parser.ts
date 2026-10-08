import { Alumno, ContactoOficial, generarMatriculaPorGrado, normalizarFechaNacimiento } from "./types";

export const ALUMNO_CSV_HEADERS = [
  "Matricula", "CURP", "Nombre_Completo", "Grado", "Grupo", "No_Lista", "Turno", "Fecha_Nacimiento", "Sexo",
  "Domicilio_Calle_Numero", "Colonia", "Municipio_Estado", "Tel_Casa", "Tipo_Sangre", "Estatura_M", "Peso_KG",
  "Con_Quien_Vive", "Papa_Nombre", "Papa_Celular", "Papa_Ocupacion", "Papa_Tel_Trabajo", "Papa_Domicilio_Trabajo",
  "Mama_Nombre", "Mama_Celular", "Mama_Ocupacion", "Mama_Tel_Trabajo", "Mama_Domicilio_Trabajo",
  "Es_Repetidor", "Escuela_Procedencia", "Grados_Repetidos", "Anos_Primaria", "Padece_Enfermedad",
  "Especifique_Enfermedad", "Alergias", "Servicio_Medico", "Clinica_No", "No_Afiliacion", "Servicio_USAER",
  "C1_Nombre", "C1_Telefono", "C1_Relacion", "C2_Nombre", "C2_Telefono", "C2_Relacion",
];

export interface CSVImportRecord { alumno: Alumno; rowNumber: number; errors: string[] }
export interface CSVImportResult {
  alumnos: Alumno[];
  records: CSVImportRecord[];
  coloniasUnicas: string[];
  errores: string[];
}

const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, "").trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const cleanText = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (["undefined", "null", "nan"].includes(text.toLowerCase())) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toLocaleUpperCase();
};
const phone = (value: unknown) => {
  const digits = cleanText(value).replace(/\D/g, "");
  return digits.length === 10 ? digits : "";
};

export function parseCSVMaestro(csvText: string): CSVImportResult {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return { alumnos: [], records: [], coloniasUnicas: [], errores: ["El archivo CSV está vacío o solo contiene la línea de encabezados."] };
  const headers = rows[0].map(normalizeHeader);
  const index = new Map(headers.map((header, i) => [header, i]));
  const alumnos: Alumno[] = [];
  const records: CSVImportRecord[] = [];
  const colonias = new Set<string>();
  const seenCurps = new Set<string>();
  const counters: Record<number, number> = { 1: 1, 2: 1, 3: 1 };
  const errores: string[] = [];

  rows.slice(1).forEach((row, offset) => {
    if (row.every((cell) => !cell.trim())) return;
    const rowNumber = offset + 2;
    const value = (header: string) => cleanText(row[index.get(normalizeHeader(header)) ?? -1] ?? "");
    const curp = value("CURP");
    const nombre = value("Nombre_Completo");
    const gradoRaw = value("Grado");
    const grupo = value("Grupo");
    const rowErrors: string[] = [];
    if (!nombre) rowErrors.push("Falta Nombre_Completo");
    if (!curp) rowErrors.push("Falta CURP");
    if (!gradoRaw) rowErrors.push("Falta Grado");
    if (!grupo) rowErrors.push("Falta Grupo");
    if (curp && seenCurps.has(curp)) rowErrors.push("CURP duplicada en el archivo");
    if (curp) seenCurps.add(curp);

    const gradoNumber = Number(gradoRaw);
    const grado = ([1, 2, 3].includes(gradoNumber) ? gradoNumber : 1) as 1 | 2 | 3;
    const grupoValid = /^[A-G]$/.test(grupo) ? grupo as Alumno["grupo"] : "A";
    const matricula = value("Matricula") || generarMatriculaPorGrado(grado, counters[grado]++);
    const fechaRaw = value("Fecha_Nacimiento");
    const fecha = normalizarFechaNacimiento(fechaRaw);
    if (fechaRaw && !fecha) errores.push(`Línea ${rowNumber}: Fecha_Nacimiento no válida.`);
    const colonia = value("Colonia");
    if (colonia) colonias.add(colonia);
    const turnoRaw = value("Turno");
    const turno = (turnoRaw.includes("VESP") ? "VESPERTINO" : "MATUTINO") as Alumno["turno"];
    const sexoRaw = value("Sexo");
    const sexo = (sexoRaw.startsWith("F") ? "F" : "M") as Alumno["sexo"];
    const phoneFields = ["Tel_Casa", "Papa_Celular", "Papa_Tel_Trabajo", "Mama_Celular", "Mama_Tel_Trabajo", "C1_Telefono", "C2_Telefono"];
    const fields: Record<string, string> = {};
    ALUMNO_CSV_HEADERS.forEach((header) => {
      if (["Matricula", "CURP", "Nombre_Completo", "Grado", "Grupo", "No_Lista", "Turno", "Fecha_Nacimiento", "Sexo", "Domicilio_Calle_Numero", "Colonia", "C1_Nombre", "C1_Telefono", "C1_Relacion", "C2_Nombre", "C2_Telefono", "C2_Relacion"].includes(header)) return;
      const prop = header.toLocaleLowerCase();
      fields[prop] = phoneFields.includes(header) ? phone(value(header)) : value(header);
    });
    const c1Name = value("C1_Nombre"), c2Name = value("C2_Nombre");
    const contacts: ContactoOficial[] = [];
    if (c1Name || value("C1_Telefono")) contacts.push({ prioridad: 1, es_tutor_legal: false, nombre: c1Name, telefono: phone(value("C1_Telefono")), parentesco: value("C1_Relacion") });
    if (c2Name || value("C2_Telefono")) contacts.push({ prioridad: 2, es_tutor_legal: false, nombre: c2Name, telefono: phone(value("C2_Telefono")), parentesco: value("C2_Relacion") });
    const noListaRaw = value("No_Lista");
    const alumno = {
      ...fields,
      matricula, curp, nombre_completo: nombre, grado, grupo: grupoValid,
      no_lista: noListaRaw && Number.isFinite(Number(noListaRaw)) ? Number(noListaRaw) : 0,
      turno, fecha_nacimiento: fecha, sexo,
      domicilio: { calle_numero: value("Domicilio_Calle_Numero"), colonia },
      contactos_oficiales: contacts, estatus: "ACTIVO" as const, creado_el: new Date().toISOString(),
    } as Alumno;
    records.push({ alumno, rowNumber, errors: rowErrors });
    if (!rowErrors.length) alumnos.push(alumno);
    else errores.push(`Línea ${rowNumber}: ${rowErrors.join(", ")}.`);
  });
  return { alumnos, records, coloniasUnicas: Array.from(colonias), errores };
}

export function parseCSVLine(line: string): string[] {
  const delimiter = detectDelimiter(line);
  const result: string[] = [];
  let current = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && inQuotes) { current += '"'; i++; }
    else if (char === '"') inQuotes = !inQuotes;
    else if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ""; }
    else current += char;
  }
  result.push(current.trim());
  return result;
}
function detectDelimiter(line: string): string {
  let comma = 0, semi = 0, quoted = false;
  for (const char of line) { if (char === '"') quoted = !quoted; else if (!quoted && char === ",") comma++; else if (!quoted && char === ";") semi++; }
  return semi > comma ? ";" : ",";
}
function parseCSV(text: string): string[][] {
  const delimiter = detectDelimiter(text.split(/\r?\n/, 1)[0] || ",");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && text[i + 1] === '"' && quoted) { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function alumnoToCSVRow(alumno: Alumno): string[] {
  const a = alumno as Alumno & Record<string, any>;
  const contacts = a.contactos_oficiales || [];
  const c1 = contacts.find((c) => c.prioridad === 1), c2 = contacts.find((c) => c.prioridad === 2);
  const direct: Record<string, unknown> = {
    Matricula: a.matricula, CURP: a.curp, Nombre_Completo: a.nombre_completo, Grado: a.grado, Grupo: a.grupo,
    No_Lista: a.no_lista, Turno: a.turno, Fecha_Nacimiento: a.fecha_nacimiento, Sexo: a.sexo,
    Domicilio_Calle_Numero: a.domicilio?.calle_numero, Colonia: a.domicilio?.colonia,
    C1_Nombre: a.c1_nombre ?? c1?.nombre, C1_Telefono: a.c1_telefono ?? c1?.telefono, C1_Relacion: a.c1_relacion ?? c1?.parentesco,
    C2_Nombre: a.c2_nombre ?? c2?.nombre, C2_Telefono: a.c2_telefono ?? c2?.telefono, C2_Relacion: a.c2_relacion ?? c2?.parentesco,
  };
  const sourceKeys: Record<string, string> = {
    Municipio_Estado: "municipio_estado", Tel_Casa: "tel_casa", Tipo_Sangre: "tipo_sangre", Estatura_M: "estatura_m", Peso_KG: "peso_kg",
    Con_Quien_Vive: "con_quien_vive", Papa_Nombre: "papa_nombre", Papa_Celular: "papa_celular", Papa_Ocupacion: "papa_ocupacion",
    Papa_Tel_Trabajo: "papa_tel_trabajo", Papa_Domicilio_Trabajo: "papa_domicilio_trabajo", Mama_Nombre: "mama_nombre", Mama_Celular: "mama_celular",
    Mama_Ocupacion: "mama_ocupacion", Mama_Tel_Trabajo: "mama_tel_trabajo", Mama_Domicilio_Trabajo: "mama_domicilio_trabajo",
    Es_Repetidor: "es_repetidor", Escuela_Procedencia: "escuela_procedencia", Grados_Repetidos: "grados_repetidos", Anos_Primaria: "anos_primaria",
    Padece_Enfermedad: "padece_enfermedad", Especifique_Enfermedad: "especifique_enfermedad", Alergias: "alergias", Servicio_Medico: "servicio_medico",
    Clinica_No: "clinica_no", No_Afiliacion: "no_afiliacion", Servicio_USAER: "servicio_usaer",
  };
  for (const [header, key] of Object.entries(sourceKeys)) direct[header] = a[key];
  return ALUMNO_CSV_HEADERS.map((header) => csvEscape(String(direct[header] ?? "")));
}
const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;
export function generateSampleCSV(): string {
  const values: Record<string, string> = { CURP: "AOCN131222MQTRSA9", Nombre_Completo: "ALUMNO DE EJEMPLO", Grado: "2", Grupo: "A", No_Lista: "1", Turno: "MATUTINO", Fecha_Nacimiento: "2013-12-22", Sexo: "F", Colonia: "CENTRO" };
  return `\uFEFF${ALUMNO_CSV_HEADERS.join(",")}\r\n${ALUMNO_CSV_HEADERS.map((h) => csvEscape(values[h] || "")).join(",")}`;
}
export function generateAlumnosCSV(alumnos: Alumno[]): string {
  return `\uFEFF${ALUMNO_CSV_HEADERS.join(",")}\r\n${alumnos.map((alumno) => alumnoToCSVRow(alumno).join(",")).join("\r\n")}`;
}
