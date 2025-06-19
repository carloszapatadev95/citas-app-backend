// backend/config/database.js (VERSIÓN LIMPIA)
import { Sequelize } from 'sequelize';

// Quitamos los logs de aquí para no repetir
const options = {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
};

if (process.env.NODE_ENV === 'production') {
    options.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    };
}

const sequelize = new Sequelize(
    process.env.DB_NAME || 'citas_app',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    options
);

export default sequelize;