// Archivo: backend/routes/notifications.js
import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';
import axios from 'axios';

const router = express.Router();

// Ruta para que la app móvil guarde su token de push
router.post('/subscribe', protegerRuta, async (req, res) => {
    const { token: expoPushToken } = req.body;
    const { usuarioId } = req;

    console.log(`[Subscribe] Recibida petición para usuario ${usuarioId} con token.`);

    if (!expoPushToken || typeof expoPushToken !== 'string' || !expoPushToken.startsWith('ExponentPushToken[')) {
        console.error(`[Subscribe] Token de push inválido para usuario ${usuarioId}:`, expoPushToken);
        return res.status(400).json({ message: 'Token de push inválido o ausente.' });
    }

    try {
        // Guardamos el token de Expo directamente como string.
        // La columna en el modelo Usuario debe ser de tipo STRING o TEXT.
        await Usuario.update(
            { pushSubscription: expoPushToken },
            { where: { id: usuarioId } }
        );
        console.log(`[Subscribe] Suscripción guardada para usuario ${usuarioId}.`);

        // Enviamos una notificación de bienvenida para confirmar.
        await axios.post('https://exp.host/--/api/v2/push/send', {
            to: expoPushToken,
            sound: 'default',
            title: '¡Suscripción Confirmada!',
            body: 'Recibirás recordatorios de tus citas aquí.'
        });
        
        console.log(`[Push Expo] Notificación de bienvenida enviada a usuario ${usuarioId}`);
        res.status(201).json({ message: 'Suscripción exitosa.' });

    } catch (error) {
        console.error(`[Subscribe Error] Usuario ${usuarioId}:`, error.response?.data || error);
        res.status(500).json({ message: 'Error en el servidor al guardar la suscripción.' });
    }
});

// Esta ruta es para la versión web y usa las claves VAPID.
router.get('/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

export default router;