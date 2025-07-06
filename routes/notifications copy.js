// Archivo: backend/routes/notifications.js
// Propósito: Manejar las rutas relacionadas con las notificaciones push.

import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';
import webpush from '../config/webpush.js';

const router = express.Router();

// Endpoint para enviar la clave pública VAPID al frontend.
// Esta ruta es pública y no necesita protección.
router.get('/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

// Endpoint para que el cliente guarde su suscripción.
// Esta ruta SÍ está protegida, porque necesitamos saber qué usuario se está suscribiendo.
router.post('/subscribe', protegerRuta, async (req, res) => {
    const subscription = req.body;
    const usuarioId = req.usuarioId;

    try {
        const subscriptionAsString = JSON.stringify(subscription);
        await Usuario.update(
            { pushSubscription: subscription },
            { where: { id: usuarioId } }
        );

        // Preparamos y enviamos una notificación de bienvenida para confirmar.
        const payload = JSON.stringify({
            title: '¡Suscripción Exitosa!',
            message: 'Ahora recibirás recordatorios de tus citas.'
        });

        await webpush.sendNotification(subscription, payload);

        res.status(201).json({ message: 'Suscripción guardada con éxito.' });
    } catch (error) {
        console.error('Error al guardar la suscripción o enviar notificación:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

export default router;