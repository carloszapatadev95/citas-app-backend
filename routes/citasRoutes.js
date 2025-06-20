// Archivo: backend/routes/citasRoutes.js
// Propósito: Gestionar todos los endpoints CRUD para las citas.

import express from 'express';
import { Cita } from '../models/index.js'; // Importamos Cita desde el centralizador
import { protegerRuta } from '../middleware/authMiddleware.js';

const router = express.Router();

// Aplicamos el middleware de protección a todas las rutas de este archivo.
router.use(protegerRuta);

// GET /api/citas -> Obtener todas las citas del usuario logueado
router.get('/', async (req, res) => {
    try {
        const citas = await Cita.findAll({ where: { usuarioId: req.usuarioId } });
        res.json(citas);
    } catch (error) {
        console.error("ERROR DETALLADO EN GET /api/citas:", error);
        res.status(500).json({ message: 'Error al obtener las citas.', error: error.message });
    }
});

// POST /api/citas -> Crear una nueva cita
router.post('/', async (req, res) => {
    try {
        const { titulo, fecha, descripcion } = req.body;
        const datosParaCrear = {
            titulo,
            fecha,
            descripcion,
            usuarioId: req.usuarioId 
        };
        const nuevaCita = await Cita.create(datosParaCrear);
        res.status(201).json(nuevaCita);
    } catch (error) {
        console.error("ERROR DETALLADO AL CREAR CITA:", error);
        res.status(400).json({ message: 'Error al crear la cita', error: error.message });
    }
});

// PUT /api/citas/:id -> Actualizar una cita existente
router.put('/:id', async (req, res) => {
    try {
        const cita = await Cita.findOne({ where: { id: req.params.id, usuarioId: req.usuarioId } });

        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada o no pertenece al usuario.' });
        }

        // --- INICIO DE LA MODIFICACIÓN ---
        // Preparamos los nuevos datos que vienen del formulario
        const nuevosDatos = req.body;
        // Forzamos el reseteo del estado del recordatorio
        nuevosDatos.recordatorioEnviado = false; 
        // --- FIN DE LA MODIFICACIÓN ---

        // Actualizamos la cita con los nuevos datos
        await cita.update(nuevosDatos);
        res.json(cita);
    } catch (error) {
        console.error(`ERROR AL ACTUALIZAR CITA ${req.params.id}:`, error);
        res.status(400).json({ message: 'Error al actualizar la cita', error: error.message });
    }
});

// DELETE /api/citas/:id -> Eliminar una cita
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