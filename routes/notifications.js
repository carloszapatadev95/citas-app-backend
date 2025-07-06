// Archivo: backend/routes/notifications.js
// Propósito: Manejar el registro de suscripciones (web y móvil) y proveer la clave VAPID.

import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';

const router = express.Router();

// Esta ruta recibe el objeto de suscripción (web) o el objeto con el token (móvil).
router.post('/subscribe', protegerRuta, async (req, res) => {
    const subscriptionData = req.body;
    const { usuarioId } = req;

    if (!subscriptionData || (typeof subscriptionData !== 'object')) {
        return res.status(400).json({ message: 'No se proporcionó información de suscripción válida.' });
    }

    try {
        // Guardamos la suscripción, sea cual sea su formato, como un string JSON.
        await Usuario.update(
            { pushSubscription: JSON.stringify(subscriptionData) },
            { where: { id: usuarioId } }
        );
        
        // No enviamos notificación de bienvenida aquí para mantener la ruta agnóstica.
        // La confirmación es la respuesta 201.
        res.status(201).json({ message: 'Suscripción guardada con éxito.' });

    } catch (error) {
        console.error('Error al guardar la suscripción:', error);
        res.status(500).json({ message: 'Error en el servidor al guardar la suscripción.' });
    }
});

// Esta ruta sigue siendo necesaria para que el cliente web obtenga la clave VAPID.
router.get('/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

export default router;