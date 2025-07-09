// Archivo: backend/middleware/planMiddleware.js
// Propósito: Middleware para limitar la creación de citas basado en el contador del usuario.

import { Usuario } from '../models/index.js';

// Renombramos la función para que sea más clara.
export const verificarLimiteDeCitas = async (req, res, next) => {
    try {
        if (!req.usuarioId) {
            return res.status(401).json({ message: 'No autorizado.' });
        }

        // 1. Obtenemos el usuario con su plan y su contador de citas creadas.
        const usuario = await Usuario.findByPk(req.usuarioId, { 
            attributes: ['plan', 'citasCreadas'] 
        });

        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // 2. Si el usuario es 'pro', tiene vía libre. No se aplican más revisiones.
        if (usuario.plan === 'pro') {
            return next();
        }
        
        // 3. Para cualquier otro plan ('trial' o 'free'), se aplica el límite.
        const LIMITE_CITAS = 5; 

        if (usuario.citasCreadas >= LIMITE_CITAS) {
            // Si el contador ya alcanzó o superó el límite, se bloquea.
            return res.status(403).json({ 
                message: `Has alcanzado el límite de ${LIMITE_CITAS} citas permitidas en tu plan.`,
                reason: 'limit_reached' 
            });
        }
        
        // 4. Si el usuario no es 'pro' pero su contador está por debajo del límite, puede continuar.
        next(); 

    } catch (error) {
        console.error("Error en el middleware de límite de citas:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};