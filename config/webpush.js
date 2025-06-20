// Archivo: backend/config/webpush.js
// Propósito: Configurar la librería web-push con nuestras claves VAPID.

import webpush from 'web-push';

// Asegúrate de que tus claves VAPID estén en el archivo .env
// y que config.js las cargue al inicio.
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("¡ERROR! Las claves VAPID no están configuradas en las variables de entorno.");
}

webpush.setVapidDetails(
    'mailto:tu-email-de-contacto@ejemplo.com', // Un email de contacto válido
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export default webpush;