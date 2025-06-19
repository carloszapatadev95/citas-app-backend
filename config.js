// backend/config.js
import dotenv from 'dotenv';

// Carga las variables del archivo .env
const result = dotenv.config();

if (result.error) {
    console.error("Error al cargar el archivo .env:", result.error);
}

console.log("Archivo .env cargado. Variables disponibles.");
console.log(`JWT_SECRET desde config.js: ${process.env.JWT_SECRET}`);