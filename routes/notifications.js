// Archivo: backend/routes/notifications.js (MODIFICADO)

import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';
import webpush from '../config/webpush.js';

const router = express.Router();

// Ruta para obtener la clave pública VAPID
router.get('/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

router.post('/subscribe', protegerRuta, async (req, res) => {
    // El frontend nos dirá qué tipo de suscripción es
    const { type, subscription, token } = req.body;
    const usuarioId = req.usuarioId;

    try {
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Obtenemos las suscripciones actuales o un objeto vacío
        const currentSubscriptions = usuario.pushSubscription || {};
        let updatedSubscriptions;

        if (type === 'web' && subscription) {
            // Lógica para Web Push (la que ya tenías)
            updatedSubscriptions = { ...currentSubscriptions, web: subscription };
            await Usuario.update(
                { pushSubscription: updatedSubscriptions },
                { where: { id: usuarioId } }
            );
            
            // Enviamos notificación de bienvenida para la web
            const payload = JSON.stringify({
                title: '¡Suscripción Web Exitosa!',
                message: 'Ahora recibirás recordatorios de tus citas.'
            });
            await webpush.sendNotification(subscription, payload);
            
            res.status(201).json({ message: 'Suscripción web guardada con éxito.' });

        } else if (type === 'expo' && token) {
            // Lógica para Expo Push (la nueva)
            updatedSubscriptions = { ...currentSubscriptions, expo: token };
            await Usuario.update(
                { pushSubscription: updatedSubscriptions },
                { where: { id: usuarioId } }
            );
            // NOTA: No enviamos notificación de bienvenida aquí para simplificar.
            // Se podría hacer, pero requeriría llamar a la API de Expo.
            res.status(201).json({ message: 'Suscripción móvil guardada con éxito.' });

        } else {
            res.status(400).json({ message: 'Tipo de suscripción no válido o datos faltantes.' });
        }

    } catch (error) {
        console.error('Error al guardar la suscripción:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

export default router;