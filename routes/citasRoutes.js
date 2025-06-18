// backend/routes/citas.js

import express from 'express';
import Cita from '../models/Cita.js'; // Importamos el modelo para poder usarlo

// Creamos un nuevo router de Express
const router = express.Router();

// --- DEFINICIÓN DE ENDPOINTS ---

// 1. OBTENER TODAS LAS CITAS (GET /api/citas)
router.get('/', async (req, res) => {
    try {
        const citas = await Cita.findAll(); // Sequelize busca todas las entradas en la tabla Citas
        res.json(citas); // Devuelve las citas como un JSON
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las citas', error: error.message });
    }
});

// 2. CREAR UNA NUEVA CITA (POST /api/citas)
router.post('/', async (req, res) => {
    try {
        // req.body contiene la información enviada desde el cliente (React)
        const nuevaCita = await Cita.create(req.body); // Sequelize crea una nueva entrada con los datos del body
        res.status(201).json(nuevaCita); // Devuelve la nueva cita creada con un código 201 (Created)
    } catch (error) {
        res.status(400).json({ message: 'Error al crear la cita', error: error.message });
    }
});

// 3. ACTUALIZAR UNA CITA (PUT /api/citas/:id)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params; // Obtenemos el ID de la URL
        const cita = await Cita.findByPk(id); // Buscamos la cita por su Primary Key (ID)

        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        // Actualizamos la cita con los nuevos datos del body
        await cita.update(req.body);
        res.json(cita); // Devolvemos la cita actualizada
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar la cita', error: error.message });
    }
});

// 4. ELIMINAR UNA CITA (DELETE /api/citas/:id)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cita = await Cita.findByPk(id);

        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        await cita.destroy(); // Sequelize elimina la entrada de la base de datos
        res.json({ message: 'Cita eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la cita', error: error.message });
    }
});


// Exportamos el router para poder usarlo en nuestro archivo principal
export default router;