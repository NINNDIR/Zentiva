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
  onSnapshot,
} from "firebase/firestore";
import {
  Alumno,
  Colonia,
  ColoniaCatalog,
  NotaConfidencial,
  UserProfile,
  UserRole,
  EventoTimeline,
  OFFICIAL_PLANTEL,
  FaltaCatalog,
  Incidente,
  AnexoComentario,
  AuditLogEntry,
  EventoRapido,
  SalidaExtraordinaria,
  RetardoRecord,
  JustificanteMedico,
  CanalizacionExterna,
  EstatusCanalizacion,
  InstitucionCanalizacionCatalog,
} from "./types";
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

// ---------------- ALUMNOS (FIRESTORE REAL EN TIEMPO REAL) ----------------

/**
 * Suscripción en tiempo real a la colección de Alumnos en Firestore.
 * Notifica automáticamente cualquier inserción, modificación o eliminación.
 */
export function subscribeAlumnos(
  onUpdate: (alumnos: Alumno[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
    try {
      const q = collection(db, "alumnos");
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => {
              const data = d.data() as any;
              // Asegurar que la edad estática no exista en memoria
              if ("edad" in data) delete data.edad;
              return data as Alumno;
            });
            setLocal(STORAGE_KEY_ALUMNOS, list);
            onUpdate(list);
          } else {
            // Si la colección está vacía en Firestore, sembrar datos iniciales
            seedAlumnosIfEmpty();
            const cached = getLocal<Alumno[]>(STORAGE_KEY_ALUMNOS, INITIAL_ALUMNOS);
            onUpdate(cached);
          }
        },
        (err) => {
          console.warn("Firestore subscribeAlumnos error, usando caché local:", err);
          if (onError) onError(err);
          const cached = getLocal<Alumno[]>(STORAGE_KEY_ALUMNOS, INITIAL_ALUMNOS);
          onUpdate(cached);
        }
      );
      return unsubscribe;
    } catch (err: any) {
      console.warn("Error iniciando listener onSnapshot de alumnos:", err);
      if (onError) onError(err);
    }
  }

  const cached = getLocal<Alumno[]>(STORAGE_KEY_ALUMNOS, INITIAL_ALUMNOS);
  onUpdate(cached);
  return () => {};
}

export async function getAlumnos(): Promise<Alumno[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "alumnos"));
      if (!snap.empty) {
        return snap.docs.map((d) => {
          const data = d.data() as any;
          if ("edad" in data) delete data.edad;
          return data as Alumno;
        });
      } else {
        await seedAlumnosIfEmpty();
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

  // Asegurar que la edad no se guarde como campo estático en Firestore
  if ("edad" in cleanAlumno) {
    delete (cleanAlumno as any).edad;
  }

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      // 1. Guardar documento del alumno con Document ID fijado a su Matrícula
      await setDoc(doc(db, "alumnos", cleanAlumno.matricula), cleanAlumno, { merge: true });
      
      // 2. Si la colonia es nueva / pendiente de revisión, guardarla en cat_colonias para el SysAdmin
      if (cleanAlumno.domicilio?.colonia) {
        const colName = cleanAlumno.domicilio.colonia.toUpperCase().trim();
        const colId = `col_${colName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        const isOtro = !!cleanAlumno.domicilio.colonia_otro;
        const isPendiente = !!cleanAlumno.domicilio.colonia_pendiente_revision;

        const cleanCol = sanitizeForFirestore<ColoniaCatalog>({
          id: colId,
          nombre: colName,
          activa: true,
          pendiente_revision: isPendiente || isOtro,
          creada_por_usuario: isOtro,
        });

        await setDoc(doc(db, "cat_colonias", colId), cleanCol, { merge: true });
      }

      console.log(`[Zentiva Firestore] Alumno ${cleanAlumno.matricula} guardado correctamente en tiempo real.`);
    }
  } catch (err: any) {
    console.error("Error al subir alumno a Firestore:", err);
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

  // Sanitizar todos los objetos de alumnos y asegurar que edad estática no se persista
  const cleanAlumnos = alumnosList.map((a) => {
    const clean = sanitizeForFirestore(a);
    if ("edad" in clean) delete (clean as any).edad;
    return clean;
  });

  if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
    try {
      const batch = writeBatch(db);

      // 1. SetDoc with merge = true for each student with ID = matricula
      for (const alumno of cleanAlumnos) {
        const ref = doc(db, "alumnos", alumno.matricula);
        batch.set(ref, alumno, { merge: true });
      }

      // 2. SetDoc with merge = true for unique colonias in cat_colonias
      for (const colName of coloniasUnicas) {
        const norm = colName.toUpperCase().trim();
        const colId = `col_${norm.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        const colRef = doc(db, "cat_colonias", colId);
        const cleanCol = sanitizeForFirestore<ColoniaCatalog>({
          id: colId,
          nombre: norm,
          activa: true,
          pendiente_revision: false,
        });
        batch.set(colRef, cleanCol, { merge: true });
      }

      console.log("[Zentiva Firestore] Ejecutando batch.commit()...");
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

// ---------------- CATÁLOGO DE COLONIAS (cat_colonias) ----------------

/**
 * Suscripción en tiempo real a la colección 'cat_colonias' en Firestore.
 */
export function subscribeColonias(
  onUpdate: (colonias: ColoniaCatalog[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
    try {
      const q = collection(db, "cat_colonias");
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data() as ColoniaCatalog);
            setLocal(STORAGE_KEY_COLONIAS, list);
            onUpdate(list);
          } else {
            seedCatColoniasIfEmpty();
            const cached = getLocal<ColoniaCatalog[]>(STORAGE_KEY_COLONIAS, INITIAL_COLONIAS);
            onUpdate(cached);
          }
        },
        (err) => {
          console.warn("Firestore onSnapshot cat_colonias error:", err);
          if (onError) onError(err);
          const cached = getLocal<ColoniaCatalog[]>(STORAGE_KEY_COLONIAS, INITIAL_COLONIAS);
          onUpdate(cached);
        }
      );
      return unsubscribe;
    } catch (err: any) {
      console.warn("Error subscribing to cat_colonias:", err);
      if (onError) onError(err);
    }
  }

  const cached = getLocal<ColoniaCatalog[]>(STORAGE_KEY_COLONIAS, INITIAL_COLONIAS);
  onUpdate(cached);
  return () => {};
}

export async function getColonias(): Promise<ColoniaCatalog[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "cat_colonias"));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ColoniaCatalog);
      } else {
        await seedCatColoniasIfEmpty();
      }
    }
  } catch (err) {
    console.warn("Firestore fetch cat_colonias fallback:", err);
  }

  const cached = getLocal<ColoniaCatalog[]>(STORAGE_KEY_COLONIAS, INITIAL_COLONIAS);
  if (!localStorage.getItem(STORAGE_KEY_COLONIAS)) {
    setLocal(STORAGE_KEY_COLONIAS, INITIAL_COLONIAS);
  }
  return cached;
}

export async function seedCatColoniasIfEmpty(): Promise<void> {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "demo-api-key-zentiva") return;
  try {
    const snap = await getDocs(collection(db, "cat_colonias"));
    if (snap.empty) {
      const batch = writeBatch(db);
      for (const col of INITIAL_COLONIAS) {
        const docRef = doc(db, "cat_colonias", col.id);
        const data: ColoniaCatalog = { ...col, activa: true, pendiente_revision: false };
        batch.set(docRef, sanitizeForFirestore(data));
      }
      await batch.commit();
      console.log("[Zentiva Firestore] cat_colonias sembrada exitosamente.");
    }
  } catch (err) {
    console.warn("No se pudo sembrar cat_colonias:", err);
  }
}

export async function seedAlumnosIfEmpty(): Promise<void> {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "demo-api-key-zentiva") return;
  try {
    const snap = await getDocs(collection(db, "alumnos"));
    if (snap.empty) {
      const batch = writeBatch(db);
      for (const al of INITIAL_ALUMNOS) {
        const docRef = doc(db, "alumnos", al.matricula);
        const clean = sanitizeForFirestore(al);
        if ("edad" in clean) delete (clean as any).edad;
        batch.set(docRef, clean);
      }
      await batch.commit();
      console.log("[Zentiva Firestore] Colección alumnos sembrada exitosamente.");
    }
  } catch (err) {
    console.warn("No se pudo sembrar alumnos:", err);
  }
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

      const qSalidas = query(
        collection(db, "salidas_extraordinarias"),
        where("alumno_matricula", "==", matricula)
      );
      const snapSalidas = await getDocs(qSalidas);
      snapSalidas.forEach((docSnap) => {
        const d = docSnap.data();
        events.push({
          id: docSnap.id,
          alumno_matricula: matricula,
          fecha: d.fecha_hora || d.creado_el || "Fecha N/A",
          tipo: "PASE_SALIDA",
          titulo: `SALIDA EXTRAORDINARIA: Retirado por ${d.quien_retira_nombre} (${d.quien_retira_parentesco})`,
          descripcion: `Motivo: ${d.motivo || "Sin especificar"}. Folio INE: ${d.ine_folio || "N/A"}. Validación telefónica y resguardo de copia física en expediente confirmados.`,
          autor: d.registrado_por_nombre || d.registrado_por || "Trabajo Social",
        });
      });

      const qJust = query(
        collection(db, "justificantes"),
        where("alumno_matricula", "==", matricula)
      );
      const snapJust = await getDocs(qJust);
      snapJust.forEach((docSnap) => {
        const d = docSnap.data();
        events.push({
          id: docSnap.id,
          alumno_matricula: matricula,
          fecha: d.fecha_emision || d.creado_el || "Fecha N/A",
          tipo: "JUSTIFICANTE",
          titulo: `JUSTIFICANTE MÉDICO (${d.folio || "S/F"})`,
          descripcion: `Ausencia: ${d.fecha_inicio} al ${d.fecha_fin} (${d.dias_totales} días). Motivo: ${d.motivo_medico}. Institución: ${d.institucion_medica || "N/A"}.`,
          autor: d.registrado_por_nombre || "Trabajo Social",
        });
      });

      const qCanal = query(
        collection(db, "canalizaciones"),
        where("alumno_matricula", "==", matricula)
      );
      const snapCanal = await getDocs(qCanal);
      snapCanal.forEach((docSnap) => {
        const d = docSnap.data();
        events.push({
          id: docSnap.id,
          alumno_matricula: matricula,
          fecha: d.fecha_canalizacion || d.creado_el || "Fecha N/A",
          tipo: "CANALIZACIÓN",
          titulo: `CANALIZACIÓN EXTERNA: ${d.institucion_destino}`,
          descripcion: `Motivo: ${d.motivo_canalizacion}. Estatus: [${d.estatus}]. Tutor Notificado: ${d.tutor_notificado ? "Sí" : "No"}. ${d.observaciones_seguimiento || ""}`,
          autor: d.registrado_por_nombre || "Trabajo Social",
        });
      });

      if (events.length > 0) {
        return events.sort((a, b) => b.fecha.localeCompare(a.fecha));
      }
    }
  } catch (err) {
    console.warn("Firestore fetch events fallback:", err);
  }

  const cachedEvents = getLocal<EventoTimeline[]>(STORAGE_KEY_EVENTS, INITIAL_EVENTS).filter(
    (e) => e.alumno_matricula === matricula
  );
  const cachedRetardos = getLocal<RetardoRecord[]>("zentiva_retardos_v5", []).filter(
    (r) => r.alumno_matricula === matricula
  );
  const cachedJustificantes = getLocal<JustificanteMedico[]>("zentiva_justificantes_v5", []).filter(
    (j) => j.alumno_matricula === matricula
  );
  const cachedCanalizaciones = getLocal<CanalizacionExterna[]>("zentiva_canalizaciones_v5", []).filter(
    (c) => c.alumno_matricula === matricula
  );

  cachedRetardos.forEach((r) => {
    cachedEvents.push({
      id: r.id,
      alumno_matricula: matricula,
      fecha: r.fecha_hora || r.fecha || "Fecha N/A",
      tipo: "RETARDO",
      titulo: "Retardo de Asistencia",
      descripcion: r.motivo ? `Retardo: ${r.motivo}` : "Llegada fuera de tolerancia al plantel.",
      autor: r.registrado_por_nombre || "Prefectura",
    });
  });

  cachedJustificantes.forEach((j) => {
    cachedEvents.push({
      id: j.id,
      alumno_matricula: matricula,
      fecha: j.fecha_emision || j.creado_el || "Fecha N/A",
      tipo: "JUSTIFICANTE",
      titulo: `JUSTIFICANTE MÉDICO (${j.folio || "S/F"})`,
      descripcion: `Ausencia: ${j.fecha_inicio} al ${j.fecha_fin} (${j.dias_totales} días). Motivo: ${j.motivo_medico}. Institución: ${j.institucion_medica || "N/A"}.`,
      autor: j.registrado_por_nombre || "Trabajo Social",
    });
  });

  cachedCanalizaciones.forEach((c) => {
    cachedEvents.push({
      id: c.id,
      alumno_matricula: matricula,
      fecha: c.fecha_canalizacion || c.creado_el || "Fecha N/A",
      tipo: "CANALIZACIÓN",
      titulo: `CANALIZACIÓN EXTERNA: ${c.institucion_destino}`,
      descripcion: `Motivo: ${c.motivo_canalizacion}. Estatus: [${c.estatus}]. Tutor Notificado: ${c.tutor_notificado ? "Sí" : "No"}. ${c.observaciones_seguimiento || ""}`,
      autor: c.registrado_por_nombre || "Trabajo Social",
    });
  });

  return cachedEvents.sort((a, b) => b.fecha.localeCompare(a.fecha));
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

// ---------------- SALIDAS EXTRAORDINARIAS DE MENOR (salidas_extraordinarias) ----------------
const STORAGE_KEY_SALIDAS_EXTRAORDINARIAS = "zentiva_salidas_extraordinarias_v5";

export async function getSalidasExtraordinarias(): Promise<SalidaExtraordinaria[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "salidas_extraordinarias"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SalidaExtraordinaria);
      }
    }
  } catch (err) {
    console.warn("Firestore getSalidasExtraordinarias fallback:", err);
  }

  const cached = getLocal<SalidaExtraordinaria[]>(STORAGE_KEY_SALIDAS_EXTRAORDINARIAS, []);
  return cached;
}

export async function addSalidaExtraordinaria(
  salida: Omit<SalidaExtraordinaria, "id">
): Promise<SalidaExtraordinaria> {
  const id = `salida-${Date.now()}`;
  const fullSalida: SalidaExtraordinaria = sanitizeForFirestore({
    id,
    creado_el: new Date().toISOString(),
    ...salida,
  });

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      // 1. Guardar en colección oficial 'salidas_extraordinarias' en Firestore
      await setDoc(doc(db, "salidas_extraordinarias", id), fullSalida);

      // 2. Guardar también en 'eventos_rapidos' para compatibilidad con el dashboard de la app
      await setDoc(
        doc(db, "eventos_rapidos", id),
        sanitizeForFirestore({
          id,
          tipo: "PASE_SALIDA",
          alumno_matricula: salida.alumno_matricula,
          alumno_nombre: salida.alumno_nombre,
          grado_grupo: salida.grado_grupo,
          fecha_hora: salida.fecha_hora,
          quien_retira_nombre: salida.quien_retira_nombre,
          quien_retira_parentesco: salida.quien_retira_parentesco,
          medio_autorizacion: salida.medio_autorizacion,
          ine_folio: salida.ine_folio,
          ine_fisica_resguardada: salida.validacion_ine_fisica_confirmada,
          motivo: salida.motivo,
          registrado_por: salida.registrado_por_nombre,
        })
      );

      console.log(`[Zentiva Firestore] Salida extraordinaria de menor (${id}) registrada exitosamente en Firestore.`);
    }
  } catch (err) {
    console.error("Error al guardar salida extraordinaria en Firestore:", err);
  }

  const list = await getSalidasExtraordinarias();
  list.unshift(fullSalida);
  setLocal(STORAGE_KEY_SALIDAS_EXTRAORDINARIAS, list);

  return fullSalida;
}

// ---------------- MÓDULO DE RETARDOS (retardos) ----------------
const STORAGE_KEY_RETARDOS = "zentiva_retardos_v5";

export async function getRetardos(): Promise<RetardoRecord[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "retardos"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RetardoRecord);
      }
    }
  } catch (err) {
    console.warn("Firestore getRetardos fallback:", err);
  }

  const cached = getLocal<RetardoRecord[]>(STORAGE_KEY_RETARDOS, []);
  return cached;
}

export async function addRetardo(retardo: Omit<RetardoRecord, "id">): Promise<RetardoRecord> {
  const id = `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const fullRetardo: RetardoRecord = sanitizeForFirestore({
    id,
    creado_el: new Date().toISOString(),
    ...retardo,
  });

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      // 1. Guardar en colección 'retardos' en Firestore
      await setDoc(doc(db, "retardos", id), fullRetardo);

      // 2. Dual-write en 'eventos_rapidos' para actualizar dashboard global
      await setDoc(
        doc(db, "eventos_rapidos", id),
        sanitizeForFirestore({
          id,
          tipo: "RETARDO_MASIVO",
          alumno_matricula: retardo.alumno_matricula,
          alumno_nombre: retardo.alumno_nombre,
          grado_grupo: retardo.grado_grupo,
          fecha_hora: retardo.fecha_hora,
          motivo: retardo.motivo,
          registrado_por: retardo.registrado_por_nombre,
        })
      );
      console.log(`[Zentiva Firestore] Retardo (${id}) registrado exitosamente.`);
    }
  } catch (err) {
    console.error("Error al guardar retardo en Firestore:", err);
  }

  const list = await getRetardos();
  list.unshift(fullRetardo);
  setLocal(STORAGE_KEY_RETARDOS, list);

  return fullRetardo;
}

export async function addRetardosMasivos(
  retardosList: Omit<RetardoRecord, "id">[]
): Promise<RetardoRecord[]> {
  if (retardosList.length === 0) return [];

  const createdRecords: RetardoRecord[] = [];
  const now = new Date().toISOString();

  if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
    try {
      const batch = writeBatch(db);

      retardosList.forEach((item, index) => {
        const id = `ret-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;
        const fullRetardo: RetardoRecord = sanitizeForFirestore({
          id,
          creado_el: now,
          es_masivo: true,
          ...item,
        });

        createdRecords.push(fullRetardo);

        // Guardar en 'retardos'
        const retRef = doc(db, "retardos", id);
        batch.set(retRef, fullRetardo);

        // Dual-write en 'eventos_rapidos'
        const evRef = doc(db, "eventos_rapidos", id);
        batch.set(
          evRef,
          sanitizeForFirestore({
            id,
            tipo: "RETARDO_MASIVO",
            alumno_matricula: item.alumno_matricula,
            alumno_nombre: item.alumno_nombre,
            grado_grupo: item.grado_grupo,
            fecha_hora: item.fecha_hora,
            motivo: item.motivo,
            registrado_por: item.registrado_por_nombre,
          })
        );
      });

      await batch.commit();
      console.log(`[Zentiva Firestore] Lote de ${createdRecords.length} retardos registrado exitosamente.`);
    } catch (err) {
      console.error("Error al registrar lote de retardos en Firestore:", err);
      if (createdRecords.length === 0) {
        retardosList.forEach((item, index) => {
          createdRecords.push({
            id: `ret-${Date.now()}-${index}`,
            creado_el: now,
            es_masivo: true,
            ...item,
          });
        });
      }
    }
  } else {
    retardosList.forEach((item, index) => {
      createdRecords.push({
        id: `ret-${Date.now()}-${index}`,
        creado_el: now,
        es_masivo: true,
        ...item,
      });
    });
  }

  const currentRetardos = await getRetardos();
  const updated = [...createdRecords, ...currentRetardos];
  setLocal(STORAGE_KEY_RETARDOS, updated);

  return createdRecords;
}

// ---------------- MÓDULO DE JUSTIFICANTES MÉDICOS (justificantes) ----------------
const STORAGE_KEY_JUSTIFICANTES = "zentiva_justificantes_v5";

export async function getJustificantes(): Promise<JustificanteMedico[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "justificantes"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as JustificanteMedico);
      }
    }
  } catch (err) {
    console.warn("Firestore getJustificantes fallback:", err);
  }

  const cached = getLocal<JustificanteMedico[]>(STORAGE_KEY_JUSTIFICANTES, []);
  return cached;
}

export async function addJustificante(
  justificante: Omit<JustificanteMedico, "id">
): Promise<JustificanteMedico> {
  const id = `just-${Date.now()}`;
  const fullJustificante: JustificanteMedico = sanitizeForFirestore({
    id,
    creado_el: new Date().toISOString(),
    ...justificante,
  });

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "justificantes", id), fullJustificante);
      console.log(`[Zentiva Firestore] Justificante médico (${id}) registrado en Firestore.`);
    }
  } catch (err) {
    console.error("Error al guardar justificante médico en Firestore:", err);
  }

  const list = await getJustificantes();
  list.unshift(fullJustificante);
  setLocal(STORAGE_KEY_JUSTIFICANTES, list);

  return fullJustificante;
}

// ---------------- MÓDULO DE CANALIZACIONES EXTERNAS (canalizaciones) ----------------
const STORAGE_KEY_CANALIZACIONES = "zentiva_canalizaciones_v5";

export async function getCanalizaciones(): Promise<CanalizacionExterna[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "canalizaciones"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CanalizacionExterna);
      }
    }
  } catch (err) {
    console.warn("Firestore getCanalizaciones fallback:", err);
  }

  const cached = getLocal<CanalizacionExterna[]>(STORAGE_KEY_CANALIZACIONES, []);
  return cached;
}

export async function addCanalizacion(
  canalizacion: Omit<CanalizacionExterna, "id">
): Promise<CanalizacionExterna> {
  const id = `canal-${Date.now()}`;
  const fullCanalizacion: CanalizacionExterna = sanitizeForFirestore({
    id,
    creado_el: new Date().toISOString(),
    ...canalizacion,
  });

  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "canalizaciones", id), fullCanalizacion);
      console.log(`[Zentiva Firestore] Canalización externa (${id}) registrada en Firestore.`);
    }
  } catch (err) {
    console.error("Error al guardar canalización en Firestore:", err);
  }

  const list = await getCanalizaciones();
  list.unshift(fullCanalizacion);
  setLocal(STORAGE_KEY_CANALIZACIONES, list);

  return fullCanalizacion;
}

export async function updateCanalizacionEstatus(
  id: string,
  nuevoEstatus: EstatusCanalizacion,
  observaciones?: string
): Promise<void> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const docRef = doc(db, "canalizaciones", id);
      const updatePayload: any = { estatus: nuevoEstatus };
      if (observaciones !== undefined) {
        updatePayload.observaciones_seguimiento = observaciones;
      }
      await updateDoc(docRef, updatePayload);
      console.log(`[Zentiva Firestore] Canalización (${id}) actualizada a estatus: ${nuevoEstatus}`);
    }
  } catch (err) {
    console.error("Error al actualizar estatus de canalización en Firestore:", err);
  }

  const list = await getCanalizaciones();
  const index = list.findIndex((c) => c.id === id);
  if (index >= 0) {
    list[index].estatus = nuevoEstatus;
    if (observaciones !== undefined) {
      list[index].observaciones_seguimiento = observaciones;
    }
    setLocal(STORAGE_KEY_CANALIZACIONES, list);
  }
}

// ---------------- GESTIÓN DE USUARIOS Y ROLES (usuarios) ----------------
const STORAGE_KEY_USUARIOS = "zentiva_usuarios_v5";

export async function getUsers(): Promise<UserProfile[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "usuarios"));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as UserProfile);
      }
    }
  } catch (err) {
    console.warn("Firestore getUsers fallback:", err);
  }

  const cached = getLocal<UserProfile[]>(STORAGE_KEY_USUARIOS, [
    {
      uid: "user-su",
      email: "admin@zentiva.edu.mx",
      displayName: "Ing. Carlos Mendoza (SU)",
      role: "SUPER_USUARIO",
      cargo: "Administrador de Sistema Escolar",
      plantel: OFFICIAL_PLANTEL,
    },
    {
      uid: "user-ts",
      email: "michausrochamariadejesus@gmail.com",
      displayName: "María de Jesús Michaus Rocha",
      role: "TRABAJADORA_SOCIAL",
      cargo: "Trabajadora Social Principal",
      plantel: OFFICIAL_PLANTEL,
    },
    {
      uid: "user-dir",
      email: "directivo@zentiva.edu.mx",
      displayName: "Mtro. Roberto Hernández",
      role: "DIRECTIVO",
      cargo: "Director Escolar",
      plantel: OFFICIAL_PLANTEL,
    },
  ]);
  return cached;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const clean = sanitizeForFirestore(profile);
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "usuarios", profile.uid), clean, { merge: true });
      console.log(`[Zentiva Firestore] Perfil de usuario (${profile.email}) guardado en Firestore.`);
    }
  } catch (err) {
    console.error("Error al guardar usuario en Firestore:", err);
  }

  const users = await getUsers();
  const index = users.findIndex((u) => u.uid === profile.uid || u.email.toLowerCase() === profile.email.toLowerCase());
  if (index >= 0) {
    users[index] = clean;
  } else {
    users.unshift(clean);
  }
  setLocal(STORAGE_KEY_USUARIOS, users);
}

export async function deleteUserProfile(uid: string): Promise<void> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await deleteDoc(doc(db, "usuarios", uid));
    }
  } catch (err) {
    console.error("Error al eliminar usuario en Firestore:", err);
  }

  const users = await getUsers();
  const updated = users.filter((u) => u.uid !== uid);
  setLocal(STORAGE_KEY_USUARIOS, updated);
}

// ---------------- CATÁLOGO DE COLONIAS (COMPLEMENTO EDIT/DELETE) ----------------
export async function saveColoniaCatalog(colonia: ColoniaCatalog): Promise<void> {
  const clean = sanitizeForFirestore(colonia);
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "cat_colonias", colonia.id), clean, { merge: true });
    }
  } catch (err) {
    console.error("Error al guardar colonia en Firestore:", err);
  }

  const list = await getColonias();
  const index = list.findIndex((c) => c.id === colonia.id);
  if (index >= 0) {
    list[index] = clean;
  } else {
    list.unshift(clean);
  }
  setLocal(STORAGE_KEY_COLONIAS, list);
}

export async function deleteColoniaCatalog(id: string): Promise<void> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await deleteDoc(doc(db, "cat_colonias", id));
    }
  } catch (err) {
    console.error("Error al eliminar colonia en Firestore:", err);
  }

  const list = await getColonias();
  const updated = list.filter((c) => c.id !== id);
  setLocal(STORAGE_KEY_COLONIAS, updated);
}

// ---------------- CATÁLOGO DE INSTITUCIONES DE CANALIZACIÓN (cat_instituciones_canalizacion) ----------------
const STORAGE_KEY_INSTITUCIONES = "zentiva_instituciones_canalizacion_v5";

const INITIAL_INSTITUCIONES: InstitucionCanalizacionCatalog[] = [
  { id: "inst-1", nombre: "DIF Municipal / Sistema DIF Estatal", tipo: "DIF", telefono: "442-123-4567", activa: true },
  { id: "inst-2", nombre: "USAER - Unidad de Apoyo a Educ. Regular", tipo: "USAER", telefono: "442-765-4321", activa: true },
  { id: "inst-3", nombre: "Centro de Salud Mental / CAPSI / CISAME", tipo: "SALUD_MENTAL", telefono: "442-999-8877", activa: true },
  { id: "inst-4", nombre: "CAPEP - Educ. Preescolar / Psicopedagogía", tipo: "CAPEP", telefono: "442-555-4433", activa: true },
  { id: "inst-5", nombre: "PANNARTI - Atención a Niñas y Niños", tipo: "PANNARTI", telefono: "442-888-1122", activa: true },
];

export async function getInstitucionesCanalizacionCatalog(): Promise<InstitucionCanalizacionCatalog[]> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      const snap = await getDocs(collection(db, "cat_instituciones_canalizacion"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InstitucionCanalizacionCatalog);
      }
    }
  } catch (err) {
    console.warn("Firestore getInstitucionesCanalizacionCatalog fallback:", err);
  }

  const cached = getLocal<InstitucionCanalizacionCatalog[]>(STORAGE_KEY_INSTITUCIONES, INITIAL_INSTITUCIONES);
  if (!localStorage.getItem(STORAGE_KEY_INSTITUCIONES)) {
    setLocal(STORAGE_KEY_INSTITUCIONES, INITIAL_INSTITUCIONES);
  }
  return cached;
}

export async function saveInstitucionCanalizacionCatalog(
  inst: InstitucionCanalizacionCatalog
): Promise<void> {
  const clean = sanitizeForFirestore(inst);
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await setDoc(doc(db, "cat_instituciones_canalizacion", inst.id), clean, { merge: true });
    }
  } catch (err) {
    console.error("Error al guardar institución de canalización en Firestore:", err);
  }

  const list = await getInstitucionesCanalizacionCatalog();
  const index = list.findIndex((i) => i.id === inst.id);
  if (index >= 0) {
    list[index] = clean;
  } else {
    list.unshift(clean);
  }
  setLocal(STORAGE_KEY_INSTITUCIONES, list);
}

export async function deleteInstitucionCanalizacionCatalog(id: string): Promise<void> {
  try {
    if (db && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
      await deleteDoc(doc(db, "cat_instituciones_canalizacion", id));
    }
  } catch (err) {
    console.error("Error al eliminar institución en Firestore:", err);
  }

  const list = await getInstitucionesCanalizacionCatalog();
  const updated = list.filter((i) => i.id !== id);
  setLocal(STORAGE_KEY_INSTITUCIONES, updated);
}
