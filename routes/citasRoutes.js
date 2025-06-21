// Archivo: backend/routes/citasRoutes.js
// Propósito: Gestionar todos los endpoints CRUD para las citas y enviar confirmaciones.

import express from 'express';
// Importamos los modelos que necesitamos desde el centralizador
import { Cita, Usuario } from '../models/index.js'; 
import { protegerRuta } from '../middleware/authMiddleware.js';
// Importamos la función específica para enviar el correo de confirmación
import { enviarCorreoConfirmacion } from '../services/emailService.js';

const router = express.Router();

// Aplicamos el middleware de protección a TODAS las rutas de este archivo.
// Esto asegura que solo usuarios logueados puedan acceder a estos endpoints.
router.use(protegerRuta);

// === GET /api/citas -> Obtener todas las citas del usuario logueado ===
router.get('/', async (req, res) => {
    try {
        const citas = await Cita.findAll({ 
            where: { usuarioId: req.usuarioId },
            order: [['fecha', 'DESC']] // Ordenar las citas por fecha, de más nueva a más antigua
        });
        res.json(citas);
    } catch (error) {
        console.error("ERROR DETALLADO EN GET /api/citas:", error);
        res.status(500).json({ message: 'Error al obtener las citas.', error: error.message });
    }
});

// === POST /api/citas -> Crear una nueva cita y enviar correo de confirmación ===
router.post('/', async (req, res) => {
    try {
        const { titulo, fecha, descripcion } = req.body;
        
        // Creamos la cita asociándola al usuario logueado
        const nuevaCita = await Cita.create({
            titulo,
            fecha,
            descripcion,
            usuarioId: req.usuarioId 
        });

        // --- INICIO DE LA NUEVA FUNCIONALIDAD: ENVIAR CORREO ---
        // Después de crear la cita con éxito, buscamos los datos del usuario para el correo.
        const usuario = await Usuario.findByPk(req.usuarioId, {
            attributes: ['nombre', 'email'] // Solo necesitamos nombre y email
        });

        if (usuario) {
            // Llamamos a la función de envío de correo.
            // Usamos .catch() para que si el envío falla, no rompa la respuesta al frontend.
            enviarCorreoConfirmacion(usuario, nuevaCita)
                .catch(err => console.error("Fallo secundario al enviar correo de confirmación:", err));
        }
        // --- FIN DE LA NUEVA FUNCIONALIDAD ---

        // Respondemos al frontend inmediatamente con la cita creada.
        res.status(201).json(nuevaCita);

    } catch (error) {
        console.error("ERROR DETALLADO AL CREAR CITA:", error);
        res.status(400).json({ message: 'Error al crear la cita', error: error.message });
    }
});

// === PUT /api/citas/:id -> Actualizar una cita existente y reactivar recordatorios ===
router.put('/:id', async (req, res) => {
    try {
        const cita = await Cita.findOne({ where: { id: req.params.id, usuarioId: req.usuarioId } });

        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada o no pertenece al usuario.' });
        }

        const nuevosDatos = req.body;
        // Forzamos el reseteo del estado del recordatorio para que se vuelva a enviar si la fecha cambia.
        nuevosDatos.recordatorioEnviado = false; 

        await cita.update(nuevosDatos);
        res.json(cita);
    } catch (error) {
        console.error(`ERROR AL ACTUALIZAR CITA ${req.params.id}:`, error);
        res.status(400).json({ message: 'Error al actualizar la cita', error: error.message });
    }
});

// === DELETE /api/citas/:id -> Eliminar una cita ===
router.delete('/:id', async (req, res) => {
    try {
        const cita = await Cita.findOne({ where: { id: req.params.id, usuarioId: req.usuarioId } });

        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada o no pertenece al usuario.' });
        }

        await cita.destroy();
        res.json({ message: 'Cita eliminada exitosamente' });
    } catch (error) {
        console.error(`ERROR AL ELIMINAR CITA ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al eliminar la cita', error: error.message });
    }
});

export default router;