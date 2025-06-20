// Archivo: backend/routes/contact.js (REFACTORIZADO)
import express from 'express';
import { enviarCorreoContacto } from '../services/emailService.js'; // Importar la función

const router = express.Router();

router.post('/', async (req, res) => {
    if (!req.body.name || !req.body.email_contact || !req.body.message) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    try {
        await enviarCorreoContacto(req.body); // Llamar al servicio
        res.status(200).json({ message: 'Mensaje enviado exitosamente.' });
    } catch (error) {
        console.error('Error en la ruta de contacto:', error);
        res.status(500).json({ message: 'Error al enviar el mensaje.' });
    }
});

export default router;