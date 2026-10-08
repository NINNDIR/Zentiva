"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserRole, UserProfile } from "./types";
import { auth } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getUserProfile } from "./firestore-service";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithEmail: async () => false,
  logout: () => {},
});

const COOKIE_NAME = "zentiva_session";
const ROLES: UserRole[] = ["SUPER_USUARIO", "TRABAJADORA_SOCIAL", "DIRECTIVO"];

function roleFromClaims(value: unknown): UserRole | null {
  return typeof value === "string" && ROLES.includes(value as UserRole)
    ? (value as UserRole)
    : null;
}

function clearClientCache() {
  if (typeof window === "undefined") return;
  for (const storage of [window.sessionStorage, window.localStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith("zentiva_")) storage.removeItem(key);
    }
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        clearClientCache();
        Cookies.remove(COOKIE_NAME, { path: "/" });
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdTokenResult();
        const role = roleFromClaims(token.claims.role);
        if (!role) {
          await signOut(auth);
          setUser(null);
          Cookies.remove(COOKIE_NAME, { path: "/" });
          setLoading(false);
          return;
        }

        const profile = await getUserProfile(firebaseUser.uid, firebaseUser.email || "");
        const trustedProfile: UserProfile = { ...profile, role, uid: firebaseUser.uid };
        setUser(trustedProfile);
        // This cookie is only an optimistic page redirect hint. Firestore rules
        // authorize every read/write using the signed Firebase token claims.
        Cookies.set(COOKIE_NAME, "1", { expires: 1, sameSite: "Lax", path: "/" });
      } catch (error) {
        console.error("Could not load the authenticated user profile:", error);
        await signOut(auth).catch(() => {});
        setUser(null);
        clearClientCache();
        Cookies.remove(COOKIE_NAME, { path: "/" });
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const token = await credential.user.getIdTokenResult(true);
      const role = roleFromClaims(token.claims.role);
      if (!role) {
        await signOut(auth);
        throw new Error("La cuenta aún no tiene un rol institucional asignado por el administrador.");
      }

      const profile = await getUserProfile(credential.user.uid, credential.user.email || email);
      const trustedProfile: UserProfile = { ...profile, role, uid: credential.user.uid };
      setUser(trustedProfile);
      Cookies.set(COOKIE_NAME, "1", { expires: 1, sameSite: "Lax", path: "/" });
      router.push("/dashboard");
      return true;
    } catch (error: any) {
      console.error("Firebase sign-in failed:", error);
      if (auth.currentUser) await signOut(auth).catch(() => {});
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        throw new Error("Credenciales no válidas. Verifica tu correo y contraseña.");
      }
      if (error.code === "auth/user-not-found") {
        throw new Error("El correo no está registrado en Firebase Authentication.");
      }
      if (error.code === "auth/too-many-requests") {
        throw new Error("Demasiados intentos fallidos. Intenta más tarde.");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearClientCache();
    Cookies.remove(COOKIE_NAME, { path: "/" });
    signOut(auth).catch((error) => console.error("Firebase sign-out failed:", error));
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
