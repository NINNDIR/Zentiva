# 🏫 Sistema de Gestión para Trabajo Social Escolar (ServiceNow "Lite")

Plataforma web institucional diseñada bajo un enfoque **Zero-Trust** y arquitectura **Offline-First**, orientada a optimizar el control de expedientes, asistencia, protocolos de custodia y blindaje legal de incidencias en el entorno escolar.

---

## 🚀 Características Principales

*   🔒 **Control de Accesos Estricto (Zero-Trust):** Autenticación centralizada por roles (Super Usuario, Trabajadora Social y Directivos) gestionada mediante Middleware en Next.js.
*   📂 **Gestión Integral de Alumnos:** Directorio con matrícula única inmutable, datos demográficos, catálogo oficial de colonias y directorio de 3 contactos oficiales con acceso rápido a llamadas y WhatsApp.
*   🚨 **Protocolo de Salida Extraordinaria:** Registro de custodia con captura fotográfica de INE en tiempo real (vía cámara de dispositivo móvil) y almacenamiento seguro en Firebase Storage.
*   ⚖️ **Motor de Incidentes y Blindaje Legal:** Clasificación de implicados (Agresor/Víctima/Testigo), semáforo visual de SLA, anonimización automática de menores en reportes PDF y tickets inmutables con anexos de seguimiento.
*   ⚡ **Eventos Rápidos y Offline-First:** Registro masivo de retardos por lotes mediante casillas de verificación con persistencia local en Firestore ante pérdida de conectividad.
*   📄 **Generación de Formatos Legales:** Emisión instantánea de documentos oficiales a media hoja (Copia Escuela / Copia Tutor) listos para firmas físicas mediante integración con `pdfmake`.
*   📊 **Dashboards Dinámicos por Rol:** Métricas estadísticas e indicadores ejecutivos segmentados según los permisos del usuario activo.

---

## 🛠️ Stack Tecnológico

*   **Frontend & Framework:** Next.js (App Router) + React + TypeScript
*   **Estilos:** Tailwind CSS + Lucide Icons
*   **Backend & Base de Datos:** Firebase (Authentication, Cloud Firestore, Firebase Storage)
*   **Generación de Documentos:** `pdfmake`
*   **Despliegue & Arquitectura:** PWA (Progressive Web App) optimizada para dispositivos móviles y equipos de escritorio.