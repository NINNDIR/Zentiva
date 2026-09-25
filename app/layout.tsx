import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { NetworkStatusBanner } from "@/components/network-status-banner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased bg-slate-100 text-slate-900 min-h-screen selection:bg-blue-100 selection:text-blue-900`}
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
