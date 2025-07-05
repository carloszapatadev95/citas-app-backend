import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';
import axios from 'axios'; // Usaremos axios para la notificación de bienvenida

const router = express.Router();

// La ruta para la clave VAPID ya no es necesaria para el flujo móvil, pero la dejamos por si se usa en la web.
router.get('/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

router.post('/subscribe', protegerRuta, async (req, res) => {
    // Esperamos un cuerpo como { token: "ExponentPushToken[...]" }
    const { token } = req.body;
    const { usuarioId } = req;

    if (typeof token !== 'string' || !token.startsWith('ExponentPushToken[')) {
        return res.status(400).json({ message: 'Token de push inválido o ausente.' });
    }

    try {
        // Guardamos el token de Expo directamente como un string.
        await Usuario.update({ pushSubscription: token }, { where: { id: usuarioId } });

        // Enviamos una notificación de bienvenida usando la API de Expo.
        await axios.post('https://exp.host/--/api/v2/push/send', {
            to: token,
            sound: 'default',
            title: '¡Suscripción Exitosa!',
            body: 'Ahora recibirás recordatorios desde la app.'
        });
        
        console.log(`[Push Expo] Suscripción guardada y notificada para el usuario ${usuarioId}`);
        res.status(201).json({ message: 'Suscripción exitosa.' });

    } catch (error) {
        console.error('Error al guardar suscripción o enviar notificación de bienvenida:', error.response?.data || error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

export default router;