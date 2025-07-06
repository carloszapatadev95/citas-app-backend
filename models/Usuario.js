// Archivo: backend/models/Usuario.js
// Propósito: Define la estructura del usuario, con un campo de suscripción flexible.

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Usuario = sequelize.define('Usuario', {
    nombre: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    
    // --- CAMBIO IMPORTANTE ---
    // Usamos TEXT para poder guardar tanto el string del token de Expo
    // como el objeto JSON (convertido a string) de la suscripción web.
    pushSubscription: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // -------------------------

    plan: {
        type: DataTypes.ENUM('free', 'pro', 'trial'),
        defaultValue: 'trial',
        allowNull: false,
    },
    fechaFinPrueba: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    idSuscripcionTienda: {
        type: DataTypes.JSON,
        allowNull: true,
    }
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