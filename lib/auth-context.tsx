"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserRole, UserProfile, DEMO_USERS, OFFICIAL_PLANTEL } from "./types";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getOrSeedUserProfile } from "./firestore-service";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithDemoRole: (role: UserRole) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithDemoRole: async () => {},
  loginWithEmail: async () => false,
  logout: () => {},
});

const COOKIE_NAME = "zentiva_session";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session from cookie on mount
    const savedSession = Cookies.get(COOKIE_NAME);
    if (savedSession) {
      try {
        const parsed: UserProfile = JSON.parse(savedSession);
        setUser(parsed);
      } catch (err) {
        console.error("Error parsing saved session", err);
        Cookies.remove(COOKIE_NAME);
      }
    }
    setLoading(false);
  }, []);

  const saveUserSession = (profile: UserProfile) => {
    setUser(profile);
    Cookies.set(COOKIE_NAME, JSON.stringify(profile), { expires: 7, path: "/" });
  };

  const loginWithDemoRole = async (role: UserRole) => {
    setLoading(true);
    const demo = DEMO_USERS[role];
    const profile: UserProfile = {
      uid: `demo-${role.toLowerCase()}`,
      email: demo.email,
      displayName: demo.name,
      role: demo.role,
      cargo: demo.cargo,
      plantel: OFFICIAL_PLANTEL,
    };
    saveUserSession(profile);
    setLoading(false);
    router.push("/dashboard");
  };

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);

    try {
      // 1. REAL FIREBASE AUTHENTICATION
      if (auth && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key-zentiva") {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
        const firebaseUser = userCredential.user;

        // 2. Fetch User Profile Document from Firestore `usuarios`
        const profile = await getOrSeedUserProfile(firebaseUser.uid, firebaseUser.email || email);
        saveUserSession(profile);
        setLoading(false);
        router.push("/dashboard");
        return true;
      }
    } catch (err: any) {
      console.error("Firebase auth error:", err);
      setLoading(false);

      let errorMsg = "Credenciales no válidas en Firebase. Verifica tu correo y contraseña.";
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errorMsg = "Contraseña de Firebase incorrecta. Verifica tus datos de acceso.";
      } else if (err.code === "auth/user-not-found") {
        errorMsg = "El correo no se encuentra registrado en la consola de Firebase.";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "Demasiados intentos fallidos. Intenta más tarde.";
      }

      throw new Error(errorMsg);
    }

    // Fallback mode if Firebase Auth not initialized
    let matchedRole: UserRole = "TRABAJADORA_SOCIAL";
    let displayName = "María de Jesús Michaus Rocha";
    if (email.includes("admin") || email.includes("su")) {
      matchedRole = "SUPER_USUARIO";
      displayName = "Ing. Carlos Mendoza (SU)";
    } else if (email.includes("dir") || email.includes("director")) {
      matchedRole = "DIRECTIVO";
      displayName = "Mtro. Roberto Hernández";
    }

    const demo = DEMO_USERS[matchedRole];
    const profile: UserProfile = {
      uid: `usr-${Date.now()}`,
      email,
      displayName,
      role: matchedRole,
      cargo: demo.cargo,
      plantel: OFFICIAL_PLANTEL,
    };

    saveUserSession(profile);
    setLoading(false);
    router.push("/dashboard");
    return true;
  };

  const logout = () => {
    if (auth) {
      signOut(auth).catch(() => {});
    }
    setUser(null);
    Cookies.remove(COOKIE_NAME);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithDemoRole,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
