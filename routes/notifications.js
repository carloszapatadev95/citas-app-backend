import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';
import axios from 'axios';
import webpush from '../config/webpush.js';

const router = express.Router();

router.post('/subscribe', protegerRuta, async (req, res) => {
    // --- LOGS DE DEPURACIÓN ---
    console.log("--- Recibida petición en /subscribe ---");
    console.log("Cuerpo de la petición (req.body):", req.body);
    // ----------------------------

    const { token } = req.body;
    const { usuarioId } = req;

    if (typeof token !== 'string' || !token.startsWith('ExponentPushToken[')) {
        console.error("Token de push inválido recibido:", token);
        return res.status(400).json({ message: 'Token de push inválido o ausente.' });
    }

    try {
        await Usuario.update({ pushSubscription: token }, { where: { id: usuarioId } });

        await axios.post('https://exp.host/--/api/v2/push/send', {
            to: token,
            sound: 'default',
            title: '¡Suscripción Exitosa!',
            body: 'Ahora recibirás recordatorios desde la app.'
        });
        
        console.log(`[Push Expo] Suscripción guardada y notificada para el usuario ${usuarioId}`);
        res.status(201).json({ message: 'Suscripción exitosa.' });
    } catch (error) {
        console.error('Error al guardar suscripción:', error.response?.data || error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Esta ruta ya no es necesaria para Expo, pero no hace daño dejarla.
router.get('/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

export default router;