import { Alumno, ContactoOficial, generarMatriculaPorGrado } from "./types";

export interface CSVImportResult {
  alumnos: Alumno[];
  coloniasUnicas: string[];
  errores: string[];
}

export function parseCSVMaestro(csvText: string): CSVImportResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const alumnos: Alumno[] = [];
  const coloniasSet = new Set<string>();
  const curpsSet = new Set<string>();
  const errores: string[] = [];

  if (lines.length <= 1) {
    return { alumnos: [], coloniasUnicas: [], errores: ["El archivo CSV está vacío o solo contiene la línea de encabezados."] };
  }

  // Parse header line to find indexes
  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Count existing consecutive numbers per grade series
  const consecutivoMap: Record<number, number> = { 1: 1, 2: 1, 3: 1 };

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const row = parseCSVLine(rawLine);

    if (row.length < 3) continue; // Skip blank rows

    try {
      // Helper to map columns by position or header name aliases
      const getVal = (colNames: string[], defaultIndex: number): string => {
        for (const name of colNames) {
          const idx = header.indexOf(name.toLowerCase());
          if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) return row[idx].trim();
        }
        return row[defaultIndex] ? row[defaultIndex].trim() : "";
      };

      const curp = getVal(["curp"], 4).toUpperCase();

      // DEDUPLICATION: Skip duplicate CURP within the same CSV file
      if (curp && curpsSet.has(curp)) {
        errores.push(`Línea ${i + 1}: Omitido por CURP duplicada en el archivo (${curp}).`);
        continue;
      }
      if (curp) {
        curpsSet.add(curp);
      }

      const nombreCompleto = getVal(["nombre_completo", "nombre completo", "nombre"], 3).toUpperCase();
      const gradoNum = Number(getVal(["grado"], 0)) as 1 | 2 | 3;
      const grado: 1 | 2 | 3 = [1, 2, 3].includes(gradoNum) ? gradoNum : 1;
      const grupoRaw = getVal(["grupo"], 1).toUpperCase();
      const grupo = (["A", "B", "C", "D", "E", "F", "G"].includes(grupoRaw) ? grupoRaw : "A") as any;
      const noLista = Number(getVal(["no_lista", "no lista", "lista"], 2)) || i;
      const turnoRaw = getVal(["turno"], 5).toUpperCase();
      const turno = (turnoRaw.includes("VESP") ? "VESPERTINO" : "MATUTINO") as any;
      const fechaNacimiento = getVal(["fecha_nacimiento", "fecha nacimiento"], 5) || "2013-01-01";
      const sexoRaw = getVal(["sexo"], 6).toUpperCase();
      const sexo = (sexoRaw.startsWith("F") || sexoRaw === "MUJER" ? "F" : "M") as any;
      const calleNumero = getVal(["domicilio_calle_numero", "calle_numero", "calle y numero", "domicilio"], 7).toUpperCase();
      const colonia = (getVal(["colonia"], 8) || "FELIPE CARRILLO PUERTO").toUpperCase();

      if (colonia) {
        coloniasSet.add(colonia);
      }

      // Generate Immutable Matricula according to Grade (3º -> 24-XXX, 2º -> 25-XXX, 1º -> 26-XXX)
      const consecutivo = consecutivoMap[grado];
      consecutivoMap[grado] = consecutivo + 1;
      const customMatricula = getVal(["matricula"], -1);
      const matricula = customMatricula && customMatricula.includes("-") 
        ? customMatricula 
        : generarMatriculaPorGrado(grado, consecutivo);

      // Contact 1 (Tutor Principal) - Always sanitize to empty strings instead of undefined
      const c1Nombre = getVal(["c1_nombre", "tutor1_nombre", "tutor_nombre"], 9).toUpperCase();
      const c1Parentesco = getVal(["c1_parentesco", "tutor1_parentesco"], 10) || "Madre";
      const c1Telefono = getVal(["c1_telefono", "tutor1_telefono"], 11) || "";
      const c1Trabajo = getVal(["c1_lugar_trabajo", "tutor1_lugar_trabajo"], 12) || "";
      const c1TelTrabajo = getVal(["c1_telefono_trabajo", "tutor1_telefono_trabajo"], 13) || "";
      const c1Ine = getVal(["c1_ine", "tutor1_ine"], 14).toUpperCase() || "";

      const contactos: ContactoOficial[] = [
        {
          id: `c1-${i}`,
          prioridad: 1,
          es_tutor_legal: true,
          nombre: c1Nombre || "TUTOR NO REGISTRADO",
          parentesco: c1Parentesco,
          telefono: c1Telefono,
          lugar_trabajo: c1Trabajo,
          telefono_trabajo: c1TelTrabajo,
          ine_folio: c1Ine,
        },
      ];

      // Contact 2
      const c2Nombre = getVal(["c2_nombre", "tutor2_nombre"], 15).toUpperCase() || "";
      if (c2Nombre) {
        contactos.push({
          id: `c2-${i}`,
          prioridad: 2,
          es_tutor_legal: false,
          nombre: c2Nombre,
          parentesco: getVal(["c2_parentesco", "tutor2_parentesco"], 16) || "Padre",
          telefono: getVal(["c2_telefono", "tutor2_telefono"], 17) || "",
          lugar_trabajo: getVal(["c2_lugar_trabajo", "tutor2_lugar_trabajo"], 18) || "",
          telefono_trabajo: getVal(["c2_telefono_trabajo", "tutor2_telefono_trabajo"], 19) || "",
          ine_folio: getVal(["c2_ine", "tutor2_ine"], 20).toUpperCase() || "",
        });
      }

      // Contact 3
      const c3Nombre = getVal(["c3_nombre", "tutor3_nombre"], 21).toUpperCase() || "";
      if (c3Nombre) {
        contactos.push({
          id: `c3-${i}`,
          prioridad: 3,
          es_tutor_legal: false,
          nombre: c3Nombre,
          parentesco: getVal(["c3_parentesco", "tutor3_parentesco"], 22) || "Contacto Emergencia",
          telefono: getVal(["c3_telefono", "tutor3_telefono"], 23) || "",
          lugar_trabajo: getVal(["c3_lugar_trabajo", "tutor3_lugar_trabajo"], 24) || "",
          telefono_trabajo: getVal(["c3_telefono_trabajo", "tutor3_telefono_trabajo"], 25) || "",
          ine_folio: getVal(["c3_ine", "tutor3_ine"], 26).toUpperCase() || "",
        });
      }

      const alumno: Alumno = {
        matricula,
        curp: curp || `CURP${Date.now()}${i}`,
        nombre_completo: nombreCompleto || `ALUMNO ${i}`,
        nombres: "",
        primer_apellido: "",
        segundo_apellido: "",
        grado,
        grupo,
        no_lista: noLista,
        turno,
        fecha_nacimiento: fechaNacimiento,
        sexo,
        domicilio: {
          calle_numero: calleNumero || "DOMICILIO CONOCIDO",
          colonia: colonia || "FELIPE CARRILLO PUERTO",
        },
        contactos_oficiales: contactos,
        estatus: "ACTIVO",
        creado_el: new Date().toISOString(),
      };

      alumnos.push(alumno);
    } catch (e: any) {
      errores.push(`Línea ${i + 1}: ${e.message || "Error al procesar fila"}`);
    }
  }

  return {
    alumnos,
    coloniasUnicas: Array.from(coloniasSet),
    errores,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "," || char === ";") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function generateSampleCSV(): string {
  const headers = [
    "Grado",
    "Grupo",
    "No_Lista",
    "Nombre_Completo",
    "CURP",
    "Fecha_Nacimiento",
    "Sexo",
    "Domicilio_Calle_Numero",
    "Colonia",
    "C1_Nombre",
    "C1_Parentesco",
    "C1_Telefono",
    "C1_Lugar_Trabajo",
    "C1_Telefono_Trabajo",
    "C1_INE",
    "C2_Nombre",
    "C2_Parentesco",
    "C2_Telefono",
    "C2_Lugar_Trabajo",
    "C2_Telefono_Trabajo",
    "C2_INE",
    "C3_Nombre",
    "C3_Parentesco",
    "C3_Telefono",
    "C3_Lugar_Trabajo",
    "C3_Telefono_Trabajo",
    "C3_INE",
  ].join(",");

  const sampleRow1 = [
    "2",
    "G",
    "1",
    "ACOSTA CRUZ NASHLA MAHELY",
    "AOCN131222MQTRSA9",
    "2013-12-22",
    "F",
    "NIÑOS HEROES NO. 13",
    "FELIPE CARRILLO PUERTO",
    "MARIA CRUZ FUENTES",
    "Madre",
    "4428368526",
    "Comercializadora del Bajío",
    "4422110099",
    "IDMEX1234567890",
    "ROBERTO ACOSTA HERNÁNDEZ",
    "Padre",
    "4421987654",
    "Talleres Industriales",
    "4423334455",
    "",
    "CARMEN FUENTES LÓPEZ",
    "Abuela",
    "4425551234",
    "Hogar",
    "",
    "",
  ].join(",");

  const sampleRow2 = [
    "1",
    "A",
    "12",
    "GARCÍA MENDOZA MATEO",
    "GARM120515HQTRRN01",
    "2014-05-15",
    "M",
    "AV. REVOLUCIÓN NO. 450",
    "SATÉLITE",
    "PATRICIA MENDOZA RÍOS",
    "Madre",
    "4429876543",
    "Hospital General de Querétaro",
    "4424445566",
    "IDMEX9876543210",
    "JORGE GARCÍA VEGA",
    "Tío",
    "4423456789",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ].join(",");

  return `${headers}\n${sampleRow1}\n${sampleRow2}`;
}
