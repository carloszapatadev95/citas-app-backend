// Archivo: backend/index.js
// Propósito: Archivo principal del servidor, configuración de Express, Socket.IO y tareas programadas.

// Carga las variables de entorno. Es la primera línea para asegurar que estén disponibles en todas partes.
import './config.js'; 

// Importaciones de librerías y módulos
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { sequelize } from './models/index.js';

// Importación de todos nuestros módulos de rutas
import citasRoutes from './routes/citasRoutes.js';
import authRoutes from './routes/auth.js';
import notificationsRoutes from './routes/notifications.js';
import contactRoutes from './routes/contact.js'; 

// Importación de nuestros servicios de tareas programadas (schedulers)
import { revisarYEnviarRecordatorios } from './services/notificationService.js'; 
import { verificarYActualizarPruebas } from './services/accountService.js'; 

// --- Configuración Inicial de Express y Socket.IO ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "https://citas-app-frontend-eight.vercel.app", // Tu URL de Vercel de producción
            /^https:\/\/citas-app-frontend-.*\.vercel\.app$/, // Regex para todas las previews de Vercel
            "http://localhost:3000" // Tu entorno de desarrollo local
        ],
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// --- Middlewares de Express ---
const corsOptions = {
    origin: function (origin, callback) {
        const vercelRegex = /^https:\/\/citas-app-frontend-.*\.vercel\.app$/;
        if (!origin || vercelRegex.test(origin) || origin === 'http://localhost:3000') {
            callback(null, true);
        } else {
            callback(new Error('La política de CORS no permite acceso desde este origen.'));
        }
    }
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Montaje de Rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/contact', contactRoutes);

// --- Lógica de Conexión de Socket.IO ---
io.on('connection', (socket) => {
    console.log(`[Socket.IO] Un cliente se ha conectado: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
    });
});

// Ruta raíz de prueba
app.get('/', (req, res) => res.send('API del Gestor de Citas funcionando correctamente!'));

// --- Función Principal de Arranque ---
const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        await sequelize.sync({ force: false }); // Mantenemos en 'false' para no borrar datos
        console.log('✅ Base de datos sincronizada exitosamente.');

        server.listen(PORT, () => {
            console.log(`🚀 Servidor (HTTP y WebSocket) corriendo en el puerto ${PORT}`);
            
            // --- INICIO DE TAREAS PROGRAMADAS (SCHEDULERS) ---

            // Tarea 1: Revisa recordatorios de citas cada minuto.
            const intervaloRecordatorios = 60 * 1000; // 60 segundos
            console.log(`[Scheduler] Planificador de RECORDATORIOS iniciado (se ejecuta cada ${intervaloRecordatorios / 1000}s).`);
            setInterval(() => revisarYEnviarRecordatorios(io), intervaloRecordatorios);
            
            // Tarea 2: Revisa cuentas de prueba expiradas cada hora.
            const intervaloPruebas = 60 * 60 * 1000; // 1 hora
            console.log(`[Scheduler] Planificador de CUENTAS DE PRUEBA iniciado (se ejecuta cada ${intervaloPruebas / (60 * 1000)}min).`);
            setInterval(verificarYActualizarPruebas, intervaloPruebas);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
    }
}

// Ejecutamos la función de arranque.
startServer();