// Archivo: backend/services/accountService.js
// Propósito: Lógica de negocio relacionada con la gestión de cuentas de usuario.

import { Op } from 'sequelize';
import { Usuario } from '../models/index.js';

/**
 * Busca usuarios cuyo período de prueba ha expirado y los cambia al plan 'free'.
 */
export const verificarYActualizarPruebas = async () => {
    console.log(`[Account Scheduler] Ejecutando tarea de verificación de períodos de prueba... ${new Date().toLocaleString()}`);

    try {
        const ahora = new Date();

        // Usamos el operador 'Op.lte' (Less Than or Equal) de Sequelize.
        // Buscamos usuarios que cumplan TODAS estas condiciones:
        // 1. Su plan es 'trial'.
        // 2. La 'fechaFinPrueba' es anterior o igual a la fecha y hora actuales.
        const usuariosExpirados = await Usuario.findAll({
            where: {
                plan: 'trial',
                fechaFinPrueba: {
                    [Op.lte]: ahora
                }
            }
        });

        if (usuariosExpirados.length === 0) {
            console.log('[Account Scheduler] No se encontraron cuentas de prueba para actualizar.');
            return;
        }

        console.log(`[Account Scheduler] Se encontraron ${usuariosExpirados.length} cuentas de prueba expiradas.`);

        // Obtenemos solo los IDs de los usuarios para una actualización más eficiente.
        const idsDeUsuarios = usuariosExpirados.map(usuario => usuario.id);

        // Actualizamos todos los usuarios encontrados en una sola consulta a la base de datos.
        const [numeroDeFilasAfectadas] = await Usuario.update(
            { plan: 'free' }, // El nuevo valor
            { where: { id: idsDeUsuarios } } // La condición
        );

        console.log(`[Account Scheduler] Se actualizaron ${numeroDeFilasAfectadas} usuarios al plan 'free'.`);

    } catch (error) {
        console.error('[Account Scheduler] Error al verificar y actualizar las pruebas:', error);
    }
};