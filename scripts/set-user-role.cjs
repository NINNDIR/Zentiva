const { applicationDefault, cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const [emailArg, roleArg] = process.argv.slice(2);
const roles = new Set(["SUPER_USUARIO", "TRABAJADORA_SOCIAL", "DIRECTIVO"]);

if (!emailArg || !roles.has(roleArg)) {
  console.error("Uso: node scripts/set-user-role.cjs correo@escuela.mx SUPER_USUARIO|TRABAJADORA_SOCIAL|DIRECTIVO");
  process.exit(1);
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const credential = serviceAccountJson
  ? cert(JSON.parse(serviceAccountJson))
  : applicationDefault();
const app = getApps()[0] || initializeApp({ credential });

async function main() {
  const auth = getAuth(app);
  const user = await auth.getUserByEmail(emailArg.trim().toLowerCase());
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), role: roleArg });
  await getFirestore(app).collection("usuarios").doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email,
    role: roleArg,
    cargo: roleArg === "SUPER_USUARIO" ? "Administrador del Sistema" : roleArg === "DIRECTIVO" ? "Directivo" : "Trabajadora Social",
    plantel: "Secundaria Felipe Carrillo Puerto",
  }, { merge: true });
  console.log(`Rol ${roleArg} asignado a ${user.email}. La persona debe cerrar sesión y volver a entrar.`);
}

main().catch((error) => {
  console.error("No se pudo asignar el rol:", error.message);
  process.exit(1);
});
