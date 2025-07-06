// Archivo: backend/routes/notifications.js

import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';
import webpush from '../config/webpush.js';

const router = express.Router();

router.post('/subscribe', protegerRuta, async (req, res) => {
    const subscriptionData = req.body;
    const usuarioId = req.usuarioId;

      if (!subscriptionData || (typeof subscriptionData !== 'object')) {
        return res.status(400).json({ message: 'No se proporcionó información de suscripción válida.' });
    }

    try {
  
         await Usuario.update(
            { pushSubscription: JSON.stringify(subscriptionData) },
            { where: { id: usuarioId } }
        )

        // Enviamos la notificación de bienvenida
        const payload = JSON.stringify({
            title: '¡Suscripción Exitosa!',
            message: 'Ahora recibirás notificaciones push nativas.'
        });

        // web-push puede manejar tanto el objeto como el string parseado
        await webpush.sendNotification(subscriptionData, payload);

                // La confirmación es la respuesta 201.
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