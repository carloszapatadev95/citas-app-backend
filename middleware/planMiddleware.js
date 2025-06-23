// Archivo: backend/middleware/planMiddleware.js
// Propósito: Middlewares para verificar el plan de suscripción de un usuario.

import { Usuario, Cita } from '../models/index.js'; // Importamos los modelos necesarios

/**
 * Middleware para verificar si un usuario tiene un plan activo ('pro' o 'trial').
 * Bloquea el acceso a usuarios con plan 'free'.
 */
export const verificarPlanActivo = async (req, res, next) => {
    try {
        // Asumimos que el middleware 'protegerRuta' ya se ejecutó
        // y nos dejó el ID del usuario en req.usuarioId.
        if (!req.usuarioId) {
            return res.status(401).json({ message: 'No autorizado, usuario no identificado.' });
        }

        const usuario = await Usuario.findByPk(req.usuarioId, {
            attributes: ['plan'] // Solo necesitamos saber el plan, es más eficiente.
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Verificamos si el plan NO es 'free'.
        if (usuario.plan === 'pro' || usuario.plan === 'trial') {
            next(); // El usuario tiene un plan activo, puede continuar.
        } else {
            // El usuario es 'free', le denegamos el acceso.
            res.status(403).json({ message: 'Acceso denegado. Esta función requiere una suscripción Pro.' });
        }

    } catch (error) {
        console.error("Error en el middleware de verificación de plan:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};


/**
 * Middleware para limitar el número de citas que puede crear un usuario 'free'.
 * Este es un ejemplo de una regla de negocio más compleja.
 */
export const limitarCitasParaPlanFree = async (req, res, next) => {
    try {
        if (!req.usuarioId) {
            return res.status(401).json({ message: 'No autorizado.' });
        }

        const usuario = await Usuario.findByPk(req.usuarioId, { attributes: ['plan'] });

        // Si el usuario es 'pro' o 'trial', no le aplicamos ningún límite.
        if (usuario.plan === 'pro' || usuario.plan === 'trial') {
            return next();
        }

        // Si el usuario es 'free', contamos sus citas activas.
        if (usuario.plan === 'free') {
            const totalCitas = await Cita.count({ where: { usuarioId: req.usuarioId } });
            
            // Límite de ejemplo: 5 citas para usuarios gratuitos.
            const LIMITE_CITAS_FREE = 5; 

            if (totalCitas >= LIMITE_CITAS_FREE) {
                return res.status(403).json({ 
                    message: `Has alcanzado el límite de ${LIMITE_CITAS_FREE} citas para el plan gratuito.`,
                    reason: 'limit_reached' 
                });
            }
        }
        
        next(); // El usuario 'free' no ha alcanzado el límite, puede crear la cita.

    } catch (error) {
        console.error("Error en el middleware de límite de citas:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};