// backend/routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/index.js';

const router = express.Router();

// --- Endpoint de Registro ---
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        // Verificar si el usuario ya existe
        const existeUsuario = await Usuario.findOne({ where: { email } });
        if (existeUsuario) {
            return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
        }

        // --- INICIO DE LÓGICA DE PRUEBA ---
        // Calcular la fecha de fin de la prueba (15 días desde ahora)
        const fechaActual = new Date();
        const fechaFinPrueba = new Date(fechaActual.setDate(fechaActual.getDate() + 15));
        // --- FIN DE LÓGICA DE PRUEBA ---
        // Crear el nuevo usuario (la contraseña se hashea automáticamente por el hook)

          // Crear el nuevo usuario, incluyendo la fecha de fin de prueba
        // El campo 'plan' se establece en 'trial' por defecto.
        const nuevoUsuario = await Usuario.create({ 
            nombre, 
            email, 
            password,
            fechaFinPrueba // Guardamos la fecha calculada
        });
      res.status(201).json({ message: 'Usuario registrado exitosamente. Período de prueba de 15 días iniciado.' });
    } catch (error) {
        console.error("ERROR AL REGISTRAR USUARIO:", error);
        res.status(500).json({ message: 'Error en el servidor al registrar el usuario.', error: error.message });
    }
});

// --- Endpoint de Login ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({ where: { email } });

        // Verificar si el usuario existe y si la contraseña es correcta
        if (!usuario || !(await usuario.compararPassword(password))) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Crear el payload del token
        const payload = {
            id: usuario.id,
            nombre: usuario.nombre,
        };
        console.log(`[LOGIN] Usando JWT_SECRET: ${process.env.JWT_SECRET}`);
        // Firmar el token
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'SECRETO_POR_DEFECTO_PARA_DESARROLLO', {
            expiresIn: '180d', // 180 días
        });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

export default router;