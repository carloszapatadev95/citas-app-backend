// backend/config.js (VERSIÓN FINAL Y ROBUSTA)
import dotenv from 'dotenv';

// 1. Solo intentamos cargar el archivo .env si NO estamos en producción.
if (process.env.NODE_ENV !== 'production') {
    console.log("-> Entorno de DESARROLLO detectado. Cargando .env...");
    const result = dotenv.config();

    if (result.error) {
        console.error("ADVERTENCIA: No se pudo cargar el archivo .env. Asegúrate de que exista en la raíz del backend.");
    }
} else {
    console.log("-> Entorno de PRODUCCIÓN detectado. Usando variables de entorno del proveedor de hosting.");
}

// 2. Depuración para verificar que las variables se están cargando correctamente
// Esta sección es útil tanto en desarrollo como en producción.
console.log("--- Verificando variables de entorno cruciales ---");
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Cargado' : 'NO CARGADO (undefined)'}`);
console.log(`DB_HOST: ${process.env.DB_HOST ? 'Cargado' : 'NO CARGADO (undefined)'}`);
console.log("-------------------------------------------------");