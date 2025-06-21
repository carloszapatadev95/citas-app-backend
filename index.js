// Archivo: backend/index.js
// Propósito: Archivo principal del servidor, configuración de Express y Socket.IO.

import './config.js'; 
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { sequelize } from './models/index.js';
import citasRoutes from './routes/citasRoutes.js';
import authRoutes from './routes/auth.js';
import notificationsRoutes from './routes/notifications.js';
import contactRoutes from './routes/contact.js'; 
import { revisarYEnviarRecordatorios } from './services/notificationService.js'; 

const app = express();
const server = http.createServer(app);

// --- INICIO DE LA CORRECCIÓN ---
// Configuración de Socket.IO
const io = new Server(server, {
    cors: {
        // La configuración de CORS para Socket.IO también debe ser explícita
        origin: [
            "https://citas-app-frontend-eight.vercel.app", // Tu URL de Vercel principal
            /^https:\/\/citas-app-frontend-.*\.vercel\.app$/, // Regex para previews
            "http://localhost:3000"
        ],
        methods: ["GET", "POST"]
    }
});

// Configuración de CORS para la API de Express
const corsOptions = {
    origin: function (origin, callback) {
        const vercelRegex = /^https:\/\/citas-app-frontend-.*\.vercel\.app$/;
        // Permitimos localhost, todos los dominios de Vercel y peticiones sin origen (Postman)
        if (!origin || vercelRegex.test(origin) || origin === 'http://localhost:3000') {
            callback(null, true);
        } else {
            callback(new Error('La política de CORS no permite acceso desde este origen.'));
        }
    }
};

app.use(cors(corsOptions));
// --- FIN DE LA CORRECCIÓN ---

app.use(express.json());

// --- Montaje de Rutas ---
app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/contact', contactRoutes);

// --- Lógica de Socket.IO ---
io.on('connection', (socket) => {
    console.log(`[Socket.IO] Un cliente se ha conectado: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
    });
});

app.get('/', (req, res) => res.send('API del Gestor de Citas funcionando correctamente!'));

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        await sequelize.sync({ force: false });
        console.log('✅ Base de datos sincronizada exitosamente.');

        server.listen(process.env.PORT || 4000, () => {
            console.log(`🚀 Servidor (HTTP y WebSocket) corriendo.`);
            setInterval(() => revisarYEnviarRecordatorios(io), 60000); 
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
    }
}

startServer();