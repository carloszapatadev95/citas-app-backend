import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';
import axios from 'axios'; // Usamos axios

const router = express.Router();

router.post('/subscribe', protegerRuta, async (req, res) => {
    // Ahora esperamos un string directamente: el Expo Push Token
    const pushToken = req.body.token; 
    const usuarioId = req.usuarioId;

    try {
        if (typeof pushToken !== 'string' || !pushToken.startsWith('ExponentPushToken[')) {
            return res.status(400).json({ message: 'Token de push inválido.' });
        }
        
        await Usuario.update({ pushSubscription: pushToken }, { where: { id: usuarioId } });

        // Enviar notificación de bienvenida usando la API de Expo
        await axios.post('https://exp.host/--/api/v2/push/send', {
            to: pushToken,
            sound: 'default',
            title: '¡Suscripción Exitosa!',
            body: 'Ahora recibirás recordatorios de tus citas.'
        });

        res.status(201).json({ message: 'Suscripción guardada y notificada con éxito.' });
    } catch (error) {
        console.error('Error al guardar la suscripción:', error.response?.data || error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// La ruta para la VAPID key ya no es necesaria para el flujo de Expo
// router.get('/vapid-public-key', ...);

export default router;