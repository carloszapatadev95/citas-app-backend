import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// 1. Creamos un objeto base de opciones de configuración
const options = {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
};

// 2. Si estamos en producción, añadimos las opciones de SSL al objeto
if (process.env.NODE_ENV === 'production') {
    options.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    };
}

// 3. Creamos la instancia de Sequelize pasando las opciones dinámicas
const sequelize = new Sequelize(
    process.env.DB_NAME || 'citas_app',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    options // Pasamos el objeto de opciones completo
);

export default sequelize;