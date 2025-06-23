// Archivo: backend/routes/billing.js
// Propósito: Manejar las rutas relacionadas con la facturación y suscripciones.

import express from 'express';
import jwt from 'jsonwebtoken';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';

const router = express.Router();

router.use(protegerRuta);

// Endpoint para "simular" la compra de una suscripción Pro.
router.post('/subscribe-pro', async (req, res) => {
    try {
        const usuarioId = req.usuarioId;
        const usuario = await Usuario.findByPk(usuarioId);

        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        
        // Si el usuario ya es Pro, no hacemos nada.
        if (usuario.plan === 'pro') {
            return res.status(400).json({ message: "Ya tienes una suscripción Pro activa." });
        }

        await usuario.update({
            plan: 'pro',
            fechaFinPrueba: null, 
        });

        // Generamos un NUEVO token con el plan actualizado.
        const payload = { id: usuario.id, nombre: usuario.nombre, plan: 'pro' };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        console.log(`[Billing] El usuario ${usuarioId} se ha suscrito al plan Pro.`);
        // Devolvemos el nuevo token al frontend.
        res.status(200).json({ 
            message: "¡Felicidades! Ahora tienes una suscripción Pro.",
            token: token
        });

    } catch (error) {
        console.error("Error al procesar la suscripción Pro:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

export default router;