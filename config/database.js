// backend/config/database.js (VERSIÓN DE DEPURACIÓN)
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// --- INICIO DE LA SECCIÓN DE DEPURACIÓN ---
console.log("--- INICIANDO CONFIGURACIÓN DE BASE DE DATOS ---");
console.log(`Valor de NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Valor de DB_HOST: ${process.env.DB_HOST}`);
console.log(`¿Estamos en producción? ${process.env.NODE_ENV === 'production'}`);
console.log("----------------------------------------------");
// --- FIN DE LA SECCIÓN DE DEPURACIÓN ---

const options = {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
};

if (process.env.NODE_ENV === 'production') {
    console.log("-> Entrando en el bloque de configuración de PRODUCCIÓN.");
    options.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    };
} else {
    console.log("-> Entrando en el bloque de configuración de DESARROLLO.");
}

const sequelize = new Sequelize(
    process.env.DB_NAME || 'citas_app',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    options
);

export default sequelize;