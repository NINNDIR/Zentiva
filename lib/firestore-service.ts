import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { Alumno, Colonia, NotaConfidencial, UserProfile, UserRole, EventoTimeline, OFFICIAL_PLANTEL, FaltaCatalog, Incidente, AnexoComentario, AuditLogEntry, EventoRapido } from "./types";
import { INITIAL_ALUMNOS, INITIAL_COLONIAS, INITIAL_NOTAS, INITIAL_EVENTS, INITIAL_FALTAS, INITIAL_INCIDENTES, INITIAL_EVENTOS_RAPIDOS } from "./mock-data";

// Helper function: Sanitiza cualquier objeto convirtiendo valores `undefined` o `NaN` a cadenas vacías "" para Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return "" as any;
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (value === undefined || value === null || (typeof value === "number" && Number.isNaN(value))) {
        return "";
      }
      return value;
    })
  );
}

// Local Storage cache keys
const STORAGE_KEY_ALUMNOS = "zentiva_alumnos_v5";
const STORAGE_KEY_COLONIAS = "zentiva_colonias_v5";
const STORAGE_KEY_NOTAS = "zentiva_notas_v5";
const STORAGE_KEY_EVENTS = "zentiva_events_v5";

const getLocal = <T>(key: string, defaultVal: T): T => {
  if (typeof window === "undefined") return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (err) {
    return defaultVal;
  }
};

const setLocal = <T>(key: string, val: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error("Local storage error:", err);
  }
};

// ---------------- USUARIOS EN FIRESTORE ----------------
export async function getOrSeedUserProfile(uid: string, email: string): Promise<UserProfile> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const userDocRef = doc(db, "usuarios", uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }

      const q = query(collection(db, "usuarios"), where("email", "==", normalizedEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        return querySnap.docs[0].data() as UserProfile;
      }
    }
  } catch (err) {
    console.warn("Firestore user profile query fallback:", err);
  }

  let role: UserRole = "TRABAJADORA_SOCIAL";
  let displayName = normalizedEmail.split("@")[0].toUpperCase();
  let cargo = "Trabajadora Social Principal";

  if (normalizedEmail.includes("michausrochamariadejesus") || normalizedEmail.includes("michaus")) {
    role = "TRABAJADORA_SOCIAL";
    displayName = "María de Jesús Michaus Rocha";
    cargo = "Trabajadora Social Principal";
  } else if (normalizedEmail.includes("admin") || normalizedEmail.includes("su")) {
    role = "SUPER_USUARIO";
    displayName = "Ing. Carlos Mendoza (SU)";
    cargo = "Administrador de Sistema Escolar";
  } else if (normalizedEmail.includes("directivo") || normalizedEmail.includes("director")) {
    role = "DIRECTIVO";
    displayName = "Mtro. Roberto Hernández";
    cargo = "Director Escolar";
  }

  const newProfile: UserProfile = sanitizeForFirestore({
    uid,
    email: normalizedEmail,
    displayName,
    role,
    cargo,
    plantel: OFFICIAL_PLANTEL,
  });

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "usuarios", uid), newProfile);
    }
  } catch (e) {
    console.warn("Could not seed user doc to Firestore:", e);
  }

  return newProfile;
}

// ---------------- ALUMNOS (FIRESTORE REAL CON SANITIZACIÓN) ----------------
export async function getAlumnos(): Promise<Alumno[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "alumnos"));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Alumno);
      }
    }
  } catch (err) {
    console.warn("Firestore fetch alumnos fallback to local/mock:", err);
  }

  const cached = getLocal<Alumno[]>(STORAGE_KEY_ALUMNOS, INITIAL_ALUMNOS);
  if (!localStorage.getItem(STORAGE_KEY_ALUMNOS)) {
    setLocal(STORAGE_KEY_ALUMNOS, INITIAL_ALUMNOS);
  }
  return cached;
}

export async function getAlumnoByMatricula(matricula: string): Promise<Alumno | null> {
  const list = await getAlumnos();
  return list.find((a) => a.matricula.toLowerCase() === matricula.toLowerCase()) || null;
}

export async function saveAlumno(alumno: Alumno): Promise<void> {
  const cleanAlumno = sanitizeForFirestore(alumno);

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "alumnos", cleanAlumno.matricula), cleanAlumno, { merge: true });
      
      if (cleanAlumno.domicilio?.colonia) {
        const colName = cleanAlumno.domicilio.colonia.toUpperCase();
        const colId = `col_${colName.toLowerCase().replace(/\s+/g, "_")}`;
        const cleanCol = sanitizeForFirestore({ id: colId, nombre: colName });
        await setDoc(doc(db, "colonias", colId), cleanCol, { merge: true });
      }
      console.log(`[Zentiva Firestore] Alumno ${cleanAlumno.matricula} guardado correctamente.`);
    }
  } catch (err: any) {
    console.error("Error al subir a Firestore:", err);
    throw err;
  }

  const list = await getAlumnos();
  const index = list.findIndex((a) => a.matricula === cleanAlumno.matricula);
  if (index >= 0) {
    list[index] = cleanAlumno;
  } else {
    list.unshift(cleanAlumno);
  }
  setLocal(STORAGE_KEY_ALUMNOS, list);
}

export async function deactivateAlumno(matricula: string, nuevoEstatus: "BAJA" | "INACTIVO" = "BAJA"): Promise<void> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await updateDoc(doc(db, "alumnos", matricula), { estatus: nuevoEstatus });
    }
  } catch (err: any) {
    console.error("Error al dar de baja en Firestore:", err);
  }

  const list = await getAlumnos();
  const index = list.findIndex((a) => a.matricula === matricula);
  if (index >= 0) {
    list[index].estatus = nuevoEstatus;
    setLocal(STORAGE_KEY_ALUMNOS, list);
  }
}

export async function deleteAlumnoPermanently(matricula: string): Promise<void> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await deleteDoc(doc(db, "alumnos", matricula));
    }
  } catch (err: any) {
    console.error("Error al eliminar permanentemente en Firestore:", err);
  }

  const list = await getAlumnos();
  const updatedList = list.filter((a) => a.matricula !== matricula);
  setLocal(STORAGE_KEY_ALUMNOS, updatedList);
}

export async function bulkImportAlumnos(
  alumnosList: Alumno[],
  coloniasUnicas: string[]
): Promise<{ count: number }> {
  console.log(`[Zentiva Firestore] Sanitizando e importando batch de ${alumnosList.length} alumnos...`);

  // Sanitizar todos los objetos de alumnos para reemplazar undefined/NaN con ""
  const cleanAlumnos = alumnosList.map((a) => sanitizeForFirestore(a));

  if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
    try {
      const batch = writeBatch(db);

      // 1. SetDoc with merge = true for each student with ID = matricula
      for (const alumno of cleanAlumnos) {
        const ref = doc(db, "alumnos", alumno.matricula);
        batch.set(ref, alumno, { merge: true });
      }

      // 2. SetDoc with merge = true for unique colonias
      for (const colName of coloniasUnicas) {
        const norm = colName.toUpperCase().trim();
        const colId = `col_${norm.toLowerCase().replace(/\s+/g, "_")}`;
        const colRef = doc(db, "colonias", colId);
        const cleanCol = sanitizeForFirestore({ id: colId, nombre: norm });
        batch.set(colRef, cleanCol, { merge: true });
      }

      console.log("[Zentiva Firestore] Ejecutando await batch.commit()...");
      await batch.commit();
      console.log("¡Éxito al escribir batch en Firestore!");
    } catch (err: any) {
      console.error("Error al subir a Firestore:", err);
      throw err;
    }
  } else {
    console.warn("[Zentiva Firestore] Operando en modo local cache.");
  }

  // Synchronize local storage cache
  const currentAlumnos = await getAlumnos();
  const mapByMatricula = new Map<string, Alumno>();
  currentAlumnos.forEach((a) => mapByMatricula.set(a.matricula, a));
  cleanAlumnos.forEach((a) => mapByMatricula.set(a.matricula, a));

  const updatedAlumnos = Array.from(mapByMatricula.values());
  setLocal(STORAGE_KEY_ALUMNOS, updatedAlumnos);

  return { count: cleanAlumnos.length };
}

// ---------------- COLONIAS ----------------
export async function getColonias(): Promise<Colonia[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "colonias"));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Colonia);
      }
    }
  } catch (err) {
    console.warn("Firestore fetch colonias fallback:", err);
  }

  const cached = getLocal<Colonia[]>(STORAGE_KEY_COLONIAS, INITIAL_COLONIAS);
  if (!localStorage.getItem(STORAGE_KEY_COLONIAS)) {
    setLocal(STORAGE_KEY_COLONIAS, INITIAL_COLONIAS);
  }
  return cached;
}

// ---------------- NOTAS CONFIDENCIALES ----------------
export async function getNotasConfidenciales(matricula: string): Promise<NotaConfidencial[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const q = query(
        collection(db, "alumnos", matricula, "notas_confidenciales"),
        orderBy("fecha", "desc")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as NotaConfidencial);
      }
    }
  } catch (err) {
    console.warn("Firestore fetch notas fallback:", err);
  }

  const cached = getLocal<Record<string, NotaConfidencial[]>>(STORAGE_KEY_NOTAS, INITIAL_NOTAS);
  return cached[matricula] || [];
}

export async function addNotaConfidencial(nota: Omit<NotaConfidencial, "id">): Promise<NotaConfidencial> {
  const newId = `nota-${Date.now()}`;
  const fullNota: NotaConfidencial = sanitizeForFirestore({ id: newId, ...nota });

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "alumnos", nota.alumno_matricula, "notas_confidenciales", newId), fullNota);
      console.log(`[Zentiva Firestore] Nota confidencial agregada.`);
    }
  } catch (err: any) {
    console.error("Error al subir nota a Firestore:", err);
    throw err;
  }

  const cached = getLocal<Record<string, NotaConfidencial[]>>(STORAGE_KEY_NOTAS, INITIAL_NOTAS);
  const list = cached[nota.alumno_matricula] || [];
  list.unshift(fullNota);
  cached[nota.alumno_matricula] = list;
  setLocal(STORAGE_KEY_NOTAS, cached);

  return fullNota;
}

// ---------------- TIMELINE / ACTIVITY STREAM ----------------
export async function getEventosTimeline(matricula: string): Promise<EventoTimeline[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const events: EventoTimeline[] = [];

      const qInc = query(
        collection(db, "incidentes"),
        where("alumno_matricula", "==", matricula)
      );
      const snapInc = await getDocs(qInc);
      snapInc.forEach((docSnap) => {
        const d = docSnap.data();
        events.push({
          id: docSnap.id,
          alumno_matricula: matricula,
          fecha: d.fecha || d.creado_el || "Fecha N/A",
          tipo: "INCIDENTE_GRAVE",
          titulo: d.titulo || `Incidente: ${d.falta || "Reporte Disciplinario"}`,
          descripcion: d.descripcion || d.hechos || "Sin detalle",
          autor: d.autor || "Trabajo Social",
        });
      });

      const qRet = query(
        collection(db, "retardos"),
        where("alumno_matricula", "==", matricula)
      );
      const snapRet = await getDocs(qRet);
      snapRet.forEach((docSnap) => {
        const d = docSnap.data();
        events.push({
          id: docSnap.id,
          alumno_matricula: matricula,
          fecha: d.fecha || "Fecha N/A",
          tipo: "RETARDO",
          titulo: "Retardo de Asistencia",
          descripcion: d.motivo ? `Retardo: ${d.motivo}` : "Llegada fuera de tolerancia al plantel.",
          autor: "Prefectura",
        });
      });

      if (events.length > 0) {
        return events.sort((a, b) => b.fecha.localeCompare(a.fecha));
      }
    }
  } catch (err) {
    console.warn("Firestore fetch events fallback:", err);
  }

  const cachedEvents = getLocal<EventoTimeline[]>(STORAGE_KEY_EVENTS, INITIAL_EVENTS);
  return cachedEvents.filter((e) => e.alumno_matricula === matricula);
}

// STORAGE KEYS FOR INCIDENTS & CATALOGS
const STORAGE_KEY_FALTAS = "zentiva_faltas_v5";
const STORAGE_KEY_INCIDENTES = "zentiva_incidentes_v5";
const STORAGE_KEY_EVENTOS_RAPIDOS = "zentiva_eventos_rapidos_v5";
const STORAGE_KEY_ANEXOS = "zentiva_anexos_v5";
const STORAGE_KEY_AUDITORIA = "zentiva_auditoria_v5";

// ---------------- CATÁLOGO DE FALTAS (cat_faltas) ----------------
export async function getFaltasCatalog(): Promise<FaltaCatalog[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "cat_faltas"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FaltaCatalog);
      }
    }
  } catch (err) {
    console.warn("Firestore fetch cat_faltas fallback:", err);
  }

  const cached = getLocal<FaltaCatalog[]>(STORAGE_KEY_FALTAS, INITIAL_FALTAS);
  if (!localStorage.getItem(STORAGE_KEY_FALTAS)) {
    setLocal(STORAGE_KEY_FALTAS, INITIAL_FALTAS);
  }
  return cached;
}

export async function saveFaltaCatalog(falta: FaltaCatalog): Promise<void> {
  const clean = sanitizeForFirestore(falta);
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "cat_faltas", clean.id), clean, { merge: true });
    }
  } catch (err) {
    console.error("Error al guardar falta en Firestore:", err);
  }

  const list = await getFaltasCatalog();
  const idx = list.findIndex((f) => f.id === clean.id);
  if (idx >= 0) {
    list[idx] = clean;
  } else {
    list.push(clean);
  }
  setLocal(STORAGE_KEY_FALTAS, list);
}

export async function deleteFaltaCatalog(id: string): Promise<void> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await deleteDoc(doc(db, "cat_faltas", id));
    }
  } catch (err) {
    console.error("Error al eliminar falta en Firestore:", err);
  }

  const list = await getFaltasCatalog();
  const filtered = list.filter((f) => f.id !== id);
  setLocal(STORAGE_KEY_FALTAS, filtered);
}

// ---------------- INCIDENTES ----------------
export async function getIncidentes(): Promise<Incidente[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "incidentes"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Incidente);
      }
    }
  } catch (err) {
    console.warn("Firestore fetch incidentes fallback:", err);
  }

  const cached = getLocal<Incidente[]>(STORAGE_KEY_INCIDENTES, INITIAL_INCIDENTES);
  if (!localStorage.getItem(STORAGE_KEY_INCIDENTES)) {
    setLocal(STORAGE_KEY_INCIDENTES, INITIAL_INCIDENTES);
  }
  return cached;
}

export async function getIncidenteById(id: string): Promise<Incidente | null> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const docSnap = await getDoc(doc(db, "incidentes", id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Incidente;
      }
    }
  } catch (err) {
    console.warn("Firestore getIncidenteById fallback:", err);
  }

  const list = await getIncidentes();
  return list.find((i) => i.id === id) || null;
}

export async function saveIncidente(incidente: Omit<Incidente, "id" | "folio"> & { id?: string; folio?: string }): Promise<Incidente> {
  const currentIncList = await getIncidentes();
  const id = incidente.id || `inc-${Date.now()}`;
  const folio = incidente.folio || `INC-2026-${(currentIncList.length + 1).toString().padStart(4, "0")}`;

  const fullIncidente: Incidente = sanitizeForFirestore({
    ...incidente,
    id,
    folio,
    creado_el: incidente.creado_el || new Date().toISOString(),
  });

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "incidentes", id), fullIncidente, { merge: true });
    }
  } catch (err) {
    console.error("Error al guardar incidente en Firestore:", err);
    throw err;
  }

  const idx = currentIncList.findIndex((i) => i.id === id);
  if (idx >= 0) {
    currentIncList[idx] = fullIncidente;
  } else {
    currentIncList.unshift(fullIncidente);
  }
  setLocal(STORAGE_KEY_INCIDENTES, currentIncList);

  return fullIncidente;
}

export async function updateIncidenteWithAudit(
  incidenteId: string,
  newIncidenteData: Partial<Incidente>,
  usuario: UserProfile
): Promise<void> {
  const existing = await getIncidenteById(incidenteId);
  if (!existing) throw new Error("Incidente no encontrado");

  // Track modified fields
  const camposModificados: string[] = [];
  const valorAnterior: Record<string, any> = {};
  const valorNuevo: Record<string, any> = {};

  Object.keys(newIncidenteData).forEach((key) => {
    const k = key as keyof Incidente;
    if (JSON.stringify(existing[k]) !== JSON.stringify(newIncidenteData[k])) {
      camposModificados.push(key);
      valorAnterior[key] = existing[k];
      valorNuevo[key] = newIncidenteData[k];
    }
  });

  const updatedIncidente: Incidente = sanitizeForFirestore({
    ...existing,
    ...newIncidenteData,
  });

  // Update in Firestore
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "incidentes", incidenteId), updatedIncidente, { merge: true });

      // If camposModificados > 0, write audit log entry to subcollection auditoria_cambios
      if (camposModificados.length > 0) {
        const auditRef = doc(collection(db, "incidentes", incidenteId, "auditoria_cambios"));
        const auditEntry: AuditLogEntry = sanitizeForFirestore({
          id: auditRef.id,
          incidente_id: incidenteId,
          fecha_hora: new Date().toISOString(),
          usuario_id: usuario.uid,
          usuario_nombre: usuario.displayName,
          campos_modificados: camposModificados,
          valor_anterior: valorAnterior,
          valor_nuevo: valorNuevo,
        });
        await setDoc(auditRef, auditEntry);
      }
    }
  } catch (err) {
    console.error("Error al actualizar incidente con auditoría:", err);
  }

  // Update local cache
  const list = await getIncidentes();
  const idx = list.findIndex((i) => i.id === incidenteId);
  if (idx >= 0) {
    list[idx] = updatedIncidente;
    setLocal(STORAGE_KEY_INCIDENTES, list);
  }

  // Save audit log to local storage if present
  if (camposModificados.length > 0) {
    const auditMap = getLocal<Record<string, AuditLogEntry[]>>(STORAGE_KEY_AUDITORIA, {});
    const existingAudits = auditMap[incidenteId] || [];
    existingAudits.unshift({
      id: `audit-${Date.now()}`,
      incidente_id: incidenteId,
      fecha_hora: new Date().toISOString(),
      usuario_id: usuario.uid,
      usuario_nombre: usuario.displayName,
      campos_modificados: camposModificados,
      valor_anterior: valorAnterior,
      valor_nuevo: valorNuevo,
    });
    auditMap[incidenteId] = existingAudits;
    setLocal(STORAGE_KEY_AUDITORIA, auditMap);
  }
}

export async function reopenIncidente(incidenteId: string, usuario: UserProfile, motivo: string): Promise<void> {
  await updateIncidenteWithAudit(
    incidenteId,
    { estatus: "EN PROCESO" },
    usuario
  );
  await addAnexoComentario({
    incidente_id: incidenteId,
    usuario_uid: usuario.uid,
    usuario_nombre: usuario.displayName,
    usuario_cargo: usuario.cargo,
    fecha_hora: new Date().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }),
    comentario: `[REAPERTURA DE TICKET] Estatus cambiado a EN PROCESO. Motivo de reapertura: ${motivo}`,
  });
}

// ---------------- ANEXOS COMENTARIOS DE INCIDENTES ----------------
export async function getAnexosComentarios(incidenteId: string): Promise<AnexoComentario[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "incidentes", incidenteId, "comentarios"));
      if (!snap.empty) {
        return snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as AnexoComentario)
          .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora));
      }
    }
  } catch (err) {
    console.warn("Firestore getAnexosComentarios fallback:", err);
  }

  const map = getLocal<Record<string, AnexoComentario[]>>(STORAGE_KEY_ANEXOS, {});
  return map[incidenteId] || [];
}

export async function addAnexoComentario(comentario: Omit<AnexoComentario, "id">): Promise<AnexoComentario> {
  const id = `comment-${Date.now()}`;
  const fullComentario: AnexoComentario = sanitizeForFirestore({ id, ...comentario });

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "incidentes", comentario.incidente_id, "comentarios", id), fullComentario);
    }
  } catch (err) {
    console.error("Error al guardar comentario en Firestore:", err);
  }

  const map = getLocal<Record<string, AnexoComentario[]>>(STORAGE_KEY_ANEXOS, {});
  const list = map[comentario.incidente_id] || [];
  list.unshift(fullComentario);
  map[comentario.incidente_id] = list;
  setLocal(STORAGE_KEY_ANEXOS, map);

  return fullComentario;
}

// ---------------- AUDITORÍA DE CAMBIOS ----------------
export async function getAuditLogEntries(incidenteId: string): Promise<AuditLogEntry[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "incidentes", incidenteId, "auditoria_cambios"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLogEntry);
      }
    }
  } catch (err) {
    console.warn("Firestore getAuditLogEntries fallback:", err);
  }

  const map = getLocal<Record<string, AuditLogEntry[]>>(STORAGE_KEY_AUDITORIA, {});
  return map[incidenteId] || [];
}

// ---------------- EVENTOS RÁPIDOS (PASE DE SALIDA / RETARDOS) ----------------
export async function getEventosRapidos(): Promise<EventoRapido[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "eventos_rapidos"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventoRapido);
      }
    }
  } catch (err) {
    console.warn("Firestore getEventosRapidos fallback:", err);
  }

  const cached = getLocal<EventoRapido[]>(STORAGE_KEY_EVENTOS_RAPIDOS, INITIAL_EVENTOS_RAPIDOS);
  if (!localStorage.getItem(STORAGE_KEY_EVENTOS_RAPIDOS)) {
    setLocal(STORAGE_KEY_EVENTOS_RAPIDOS, INITIAL_EVENTOS_RAPIDOS);
  }
  return cached;
}

export async function addEventoRapido(evento: Omit<EventoRapido, "id">): Promise<EventoRapido> {
  const id = `ev-${Date.now()}`;
  const fullEvento: EventoRapido = sanitizeForFirestore({ id, ...evento });

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "eventos_rapidos", id), fullEvento);
    }
  } catch (err) {
    console.error("Error al guardar evento rápido en Firestore:", err);
  }

  const list = await getEventosRapidos();
  list.unshift(fullEvento);
  setLocal(STORAGE_KEY_EVENTOS_RAPIDOS, list);

  return fullEvento;
}
