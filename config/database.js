// import { Sequelize  } from "sequelize";

// const sequelize = new Sequelize(
//     'citas_app',
//     'root',
//     {
//         host: 'localhost',
//         dialect: 'mysql',
//         // logging: false, // Desactiva los logs de SQL
//     }
// );

// export default sequelize;


// backend/config/database.js

import { Sequelize } from 'sequelize';

// Creamos una nueva instancia de Sequelize con los detalles de nuestra base de datos XAMPP
const sequelize = new Sequelize(
    'citas_app', // 1. Nombre de la base de datos que creamos
    'root',      // 2. Usuario de la base de datos (por defecto en XAMPP es 'root')
    '',          // 3. Contraseña de la base de datos (por defecto en XAMPP es vacía)
    {
        host: 'localhost', // El servidor donde corre la base de datos
        dialect: 'mysql'   // Le decimos a Sequelize que estamos usando MySQL/MariaDB
    }
);

export default sequelize;