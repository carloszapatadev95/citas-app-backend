// backend/routes/citas.js
import express from 'express';
import Cita from '../models/Cita.js';
import { protegerRuta } from '../middleware/authMiddleware.js'; // 1. Importar el middleware

const router = express.Router();

// 2. Aplicar el middleware a TODAS las rutas de este archivo
router.use(protegerRuta);

// 3. Modificar los endpoints para que usen el req.usuarioId

// OBTENER LAS CITAS DEL USUARIO LOGUEADO
router.get('/', async (req, res) => {
    const citas = await Cita.findAll({ where: { usuarioId: req.usuarioId } });
    res.json(citas);
});

// CREAR UNA CITA PARA EL USUARIO LOGUEADO
router.post('/', async (req, res) => {
    const { titulo, fecha, descripcion } = req.body;
    const nuevaCita = await Cita.create({
        titulo,
        fecha,
        descripcion,
        usuarioId: req.usuarioId // Asignar el ID del usuario autenticado
    });
    res.status(201).json(nuevaCita);
});

// ACTUALIZAR Y ELIMINAR (con verificación de propiedad)
router.put('/:id', async (req, res) => {
    const cita = await Cita.findOne({ where: { id: req.params.id, usuarioId: req.usuarioId } });
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada o no pertenece al usuario.' });
    await cita.update(req.body);
    res.json(cita);
});

router.delete('/:id', async (req, res) => {
    const cita = await Cita.findOne({ where: { id: req.params.id, usuarioId: req.usuarioId } });
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada o no pertenece al usuario.' });
    await cita.destroy();
    res.json({ message: 'Cita eliminada.' });
});

export default router;