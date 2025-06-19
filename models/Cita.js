// backend/models/Cita.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cita = sequelize.define('Cita', {
    titulo: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    usuarioId: { // Esta columna es crucial
        type: DataTypes.INTEGER,
        allowNull: false,
    }
});

export default Cita;