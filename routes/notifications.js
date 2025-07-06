import express from 'express';
import { protegerRuta } from '../middleware/authMiddleware.js';
import { Usuario } from '../models/index.js';
import axios from 'axios';

const router = express.Router();

router.post('/subscribe', protegerRuta, async (req, res) => {
    // 1. Extraemos directamente el string del token del body.
    const { token: expoPushToken } = req.body;
    const { usuarioId } = req;

    if (!expoPushToken || typeof expoPushToken !== 'string') {
        return res.status(400).json({ message: 'Token de push inválido o ausente.' });
    }

    try {
        // 2. Guardamos el string del token directamente en la columna.
        await Usuario.update(
            { pushSubscription: expoPushToken }, // Sin JSON.stringify
            { where: { id: usuarioId } }
        );
        
        // La notificación de bienvenida sigue funcionando igual.
        await axios.post('https://exp.host/--/api/v2/push/send', {
            to: expoPushToken,
            sound: 'default',
            title: '¡Suscripción Exitosa!',
            body: 'Ahora recibirás recordatorios.'
        });
        
        res.status(201).json({ message: 'Suscripción guardada con éxito.' });
    } catch (error) {
        console.error('Error al guardar la suscripción:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// La ruta VAPID ya no se usa, pero la dejamos por si se reutiliza para la web.
router.get('/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

export default router;