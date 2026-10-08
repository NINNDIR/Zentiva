import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { UserRole } from "@/lib/types";

export const runtime = "nodejs";

const ROLES: UserRole[] = ["SUPER_USUARIO", "TRABAJADORA_SOCIAL", "DIRECTIVO"];

async function requireSuperUsuario(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken) return null;
  const { auth } = getFirebaseAdmin();
  const decoded = await auth.verifyIdToken(idToken, true);
  return decoded.role === "SUPER_USUARIO" ? decoded : null;
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSuperUsuario(request);
    if (!actor) return NextResponse.json({ error: "Se requiere rol de Super Usuario." }, { status: 403 });

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const cargo = typeof body.cargo === "string" ? body.cargo.trim() : "Personal Escolar";
    const role = body.role as UserRole;
    const uid = typeof body.uid === "string" ? body.uid : "";
    if (!email || !displayName || !ROLES.includes(role)) {
      return NextResponse.json({ error: "Correo, nombre y rol válido son obligatorios." }, { status: 400 });
    }

    const { auth, db } = getFirebaseAdmin();
    let target;
    let isNew = false;
    if (uid) {
      target = await auth.getUser(uid);
      target = await auth.updateUser(uid, { email, displayName, disabled: false });
    } else {
      try {
        target = await auth.getUserByEmail(email);
        target = await auth.updateUser(target.uid, { displayName, disabled: false });
      } catch (error: any) {
        if (error.code !== "auth/user-not-found") throw error;
        target = await auth.createUser({ email, displayName, emailVerified: false, disabled: false });
        isNew = true;
      }
    }

    const existingClaims = target.customClaims || {};
    await auth.setCustomUserClaims(target.uid, { ...existingClaims, role });
    await db.collection("usuarios").doc(target.uid).set({
      uid: target.uid,
      email,
      displayName,
      role,
      cargo,
      plantel: "Secundaria Felipe Carrillo Puerto",
      actualizado_el: new Date().toISOString(),
    }, { merge: true });

    const passwordResetLink = isNew
      ? await auth.generatePasswordResetLink(email, { url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/login" })
      : undefined;
    return NextResponse.json({ uid: target.uid, email, role, passwordResetLink }, { status: isNew ? 201 : 200 });
  } catch (error: any) {
    console.error("Admin user operation failed:", error);
    const status = error.code === "auth/id-token-expired" || error.code === "auth/argument-error" ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? "La sesión expiró. Inicia sesión de nuevo." : "No se pudo administrar la cuenta. Revisa la configuración del servidor." }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requireSuperUsuario(request);
    if (!actor) return NextResponse.json({ error: "Se requiere rol de Super Usuario." }, { status: 403 });
    const { uid } = await request.json();
    if (typeof uid !== "string" || !uid || uid === actor.uid) {
      return NextResponse.json({ error: "No es posible eliminar esta cuenta." }, { status: 400 });
    }
    const { auth, db } = getFirebaseAdmin();
    await auth.deleteUser(uid);
    await db.collection("usuarios").doc(uid).delete();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Admin user deletion failed:", error);
    return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 });
  }
}
