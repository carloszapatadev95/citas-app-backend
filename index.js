// =================================================================
// ARCHIVO DE ENTRADA PRINCIPAL DEL BACKEND (index.js)
// =================================================================

// 1. Cargar las variables de entorno ANTES que cualquier otra cosa.
import './config.js';

// 2. Importar las librerías necesarias
import express from 'express';
import cors from 'cors';

// 3. Importar la instancia de Sequelize desde el archivo central de modelos.
// ESTA ES LA ÚNICA LÍNEA RELACIONADA CON LA BASE DE DATOS QUE NECESITAS IMPORTAR AQUÍ.
import { sequelize } from './models/index.js'; 

// 4. Importar los módulos de rutas
// ASEGÚRATE DE QUE EL NOMBRE DEL ARCHIVO SEA CORRECTO.
// Asumiendo que se llama 'citasRoutes.js'
import citasRoutes from './routes/citasRoutes.js';
import authRoutes from './routes/auth.js';

// --- Configuración de la Aplicación Express ---
const app = express();

// Lista de orígenes permitidos
const allowedOrigins = [
    'https://citas-app-frontend-eight.vercel.app', // Tu frontend en producción
    'http://localhost:3000'                      // Tu frontend en desarrollo (Vite)
];

// Configuración de CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Permite peticiones sin origen (como las de Postman o apps móviles)
        if (!origin) return callback(null, true);
        // Si el origen está en nuestra lista blanca, permítelo
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'La política de CORS para este sitio no permite acceso desde el origen especificado.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};
app.use(cors(corsOptions));

app.use(express.json());

// --- Montaje de Rutas ---
app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡API del Gestor de Citas funcionando correctamente!');
});

// --- Arranque del Servidor ---
const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        // Usa force:true solo LA PRIMERA VEZ para arreglar las tablas.
        // Luego cámbialo a force:false.
        await sequelize.sync({ force: false }); 
        
        console.log('✅ Base de datos sincronizada exitosamente.');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
    }
}

startServer();