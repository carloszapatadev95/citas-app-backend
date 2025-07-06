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

    pushSubscription: {
        type: DataTypes.JSON, // Usamos JSON para almacenar múltiples tipos de suscripciones
        allowNull: true,
        defaultValue: {} // Un objeto vacío por defecto
    },

    plan: {
        type: DataTypes.ENUM('free', 'pro', 'trial'),
        defaultValue: 'trial', // Todo nuevo usuario empieza en un período de prueba
        allowNull: false,
    },
    fechaFinPrueba: {
        type: DataTypes.DATE,
        allowNull: true, // Es nulo si el usuario es 'free' o 'pro'
    },
    // Guardaremos el ID de la suscripción de la tienda para futuras verificaciones
    // Podemos usar un campo JSON para guardar el de Google y Apple.
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