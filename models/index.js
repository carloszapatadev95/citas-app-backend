// backend/models/index.js
import sequelize from '../config/database.js';
import Cita from './Cita.js';
import Usuario from './Usuario.js';

// DEFINIMOS LAS RELACIONES AQUÍ
Usuario.hasMany(Cita, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Cita.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Exportamos todo lo necesario
export { sequelize, Cita, Usuario };