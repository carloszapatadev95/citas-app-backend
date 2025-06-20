// Archivo: backend/models/Usuario.js
// Propósito: Definir el modelo del usuario y sus métodos.

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Usuario = sequelize.define('Usuario', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // --- CORRECCIÓN: Simplificamos la columna pushSubscription ---
    // Dejamos que el driver de la base de datos maneje la conversión a JSON.
    // Ya no necesitamos getters y setters manuales aquí.
    pushSubscription: {
        type: DataTypes.JSON,
        allowNull: true,
    },
}, {
    tableName: 'usuarios',
    hooks: {
        beforeCreate: async (usuario) => {
            const salt = await bcrypt.genSalt(10);
            usuario.password = await bcrypt.hash(usuario.password, salt);
        },
    },
});

Usuario.prototype.compararPassword = function (password) {
    return bcrypt.compare(password, this.password);
};

export default Usuario;