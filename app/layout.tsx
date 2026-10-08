import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { NetworkStatusBanner } from "@/components/network-status-banner";

export const metadata: Metadata = {
  title: "Zentiva - Sistema de Gestión para Trabajo Social Escolar",
  description: "Plataforma de gestión escolar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-[#F8FAFC] text-slate-900 min-h-screen selection:bg-blue-100 selection:text-blue-900"
        suppressHydrationWarning
      >
        <AuthProvider>
          <NetworkStatusBanner />
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
