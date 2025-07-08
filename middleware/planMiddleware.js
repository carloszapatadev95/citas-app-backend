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
            attributes: ['plan', 'citasCreadas'] // Solo necesitamos saber el plan, es más eficiente.
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Verificamos si el plan NO es 'free'.
        if (usuario.plan === 'pro') {
            return next(); // El usuario tiene un plan activo, puede continuar.
        }
        const LIMITE_CITAS = 5;

        if (usuario.citasCreadas >= LIMITE_CITAS) {
            return res.status(403).json({
                mensage: `Has alcanzado el limite de ${LIMITE_CITAS} citas permitidas en tu plan.`,
                reason: 'limit_reached'
            });
        }
       next();
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

        
        // Si el usuario es 'pro', tiene acceso ilimitado y puede continuar.
        if (usuario && usuario.plan === 'pro') {
            return next();
        }


        // Para cualquier otro plan ('free' o 'trial'), aplicamos el límite.
        const totalCitas = await Cita.count({ where: { usuarioId: req.usuarioId } });
        
        const LIMITE_CITAS = 5; // Límite para planes no-pro

        if (totalCitas >= LIMITE_CITAS) {
            // Si se alcanza el límite, se devuelve un error 403.
            return res.status(403).json({ 
                message: `Has alcanzado el límite de ${LIMITE_CITAS} citas para tu plan actual.`,
                reason: 'limit_reached' 
            });
        }
        
        // Si no es 'pro' pero no ha alcanzado el límite, puede continuar.
        next(); 

    } catch (error) {
        console.error("Error en el middleware de límite de citas:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};