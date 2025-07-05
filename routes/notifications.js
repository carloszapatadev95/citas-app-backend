// Archivo: backend/routes/notifications.js

import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';
import webpush from '../config/webpush.js';

const router = express.Router();

router.post('/subscribe', protegerRuta, async (req, res) => {
    const subscription = req.body;
    const usuarioId = req.usuarioId;

    try {
        // --- INICIO DE LA CORRECCIÓN ---
        // Convertimos el objeto de suscripción a un string JSON antes de guardarlo.
        // Esto es más compatible con la forma en que Sequelize y MySQL manejan el tipo de dato JSON.
        const subscriptionAsString = JSON.stringify(subscription);
        // --- FIN DE LA CORRECCIÓN ---

        await Usuario.update(
            { pushSubscription: subscriptionAsString }, // Guardamos el string
            { where: { id: usuarioId } }
        );

        // Enviamos la notificación de bienvenida
        const payload = JSON.stringify({
            title: '¡Suscripción Exitosa!',
            message: 'Ahora recibirás notificaciones push nativas.'
        });

        // web-push puede manejar tanto el objeto como el string parseado
        await webpush.sendNotification(subscription, payload);

        res.status(201).json({ message: 'Suscripción guardada con éxito.' });
    } catch (error) {
        console.error('Error al guardar la suscripción:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

router.get('/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

export default router;