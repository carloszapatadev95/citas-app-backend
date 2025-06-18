// backend/models/Cita.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Importamos nuestra instancia de Sequelize

// Definimos el modelo 'Cita'
const Cita = sequelize.define('Cita', {
    // El ID se crea automáticamente por Sequelize (id, auto-incremental, primary key)
    titulo: {
        type: DataTypes.STRING,
        allowNull: false // Este campo no puede estar vacío
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true // Este campo puede estar vacío
    }
    // Las columnas 'createdAt' y 'updatedAt' se crean automáticamente
});

export default Cita;