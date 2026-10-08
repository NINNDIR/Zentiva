# 🏫 Sistema de Gestión para Trabajo Social Escolar (ServiceNow "Lite")

Plataforma web institucional diseñada bajo un enfoque **Zero-Trust** y arquitectura **Offline-First**, orientada a optimizar el control de expedientes, asistencia, protocolos de custodia y blindaje legal de incidencias en el entorno escolar.

---

## 🚀 Características Principales

*   🔒 **Control de Accesos:** Firebase Authentication y permisos respaldados por Custom Claims verificados en Firestore Rules.
*   📂 **Gestión Integral de Alumnos:** Directorio con matrícula única inmutable, datos demográficos, catálogo oficial de colonias y directorio de 3 contactos oficiales con acceso rápido a llamadas y WhatsApp.
*   🚨 **Protocolo de Salida Extraordinaria:** Registro de custodia y folio de INE; la aplicación no captura ni almacena imágenes de identificaciones oficiales.
*   ⚖️ **Motor de Incidentes y Blindaje Legal:** Clasificación de implicados (Agresor/Víctima/Testigo), semáforo visual de SLA, anonimización automática de menores en reportes PDF y tickets inmutables con anexos de seguimiento.
*   ⚡ **Eventos Rápidos:** Registro individual y masivo de retardos, con aviso de conectividad.
*   📄 **Generación de Formatos Legales:** Emisión instantánea de documentos oficiales a media hoja (Copia Escuela / Copia Tutor) listos para firmas físicas mediante integración con `pdfmake`.
*   📊 **Dashboards Dinámicos por Rol:** Métricas estadísticas e indicadores ejecutivos segmentados según los permisos del usuario activo.

---

## 🛠️ Stack Tecnológico

*   **Frontend & Framework:** Next.js (App Router) + React + TypeScript
*   **Estilos:** Tailwind CSS + Lucide Icons
*   **Backend & Base de Datos:** Firebase (Authentication, Cloud Firestore, Firebase Storage)
*   **Generación de Documentos:** `pdfmake`
*   **Despliegue & Arquitectura:** PWA (Progressive Web App) optimizada para dispositivos móviles y equipos de escritorio.

## Preparación de Firebase y roles

1. Crea las cuentas iniciales en Firebase Authentication (al menos tu cuenta de Super Usuario) y configura las variables públicas de Firebase en `.env.local`.
2. Configura una cuenta de servicio de Firebase Admin fuera del repositorio. En local, define `GOOGLE_APPLICATION_CREDENTIALS` con la ruta absoluta al JSON. La clave privada no debe tener prefijo `NEXT_PUBLIC_` ni subirse al repositorio.
3. Asigna el primer rol ejecutando `npm run set-role -- correo@escuela.mx SUPER_USUARIO`. Los roles válidos son `SUPER_USUARIO`, `TRABAJADORA_SOCIAL` y `DIRECTIVO`. La persona debe cerrar sesión y volver a entrar para renovar el token.
4. Las cuentas posteriores se crean desde Panel Admin. El servidor asigna los Custom Claims y muestra un enlace de configuración de contraseña para entregar a la persona.
5. Publica las reglas de seguridad con Firebase CLI: `firebase deploy --only firestore:rules,storage`. El archivo `proxy.ts` solo facilita la redirección de páginas; las reglas de Firestore son la protección de datos.

El navegador no puede asignarse roles a sí mismo. Si no hay credenciales de administrador en el entorno, el formulario del Panel Admin se mantiene cerrado y muestra un error de configuración.
