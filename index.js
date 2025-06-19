// backend/index.js (VERSIÓN FINAL)
import './config.js'; 
import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index.js'; // Importa desde el centralizador
import citasRoutes from './routes/citasRoutes.js'; // Ahora el nombre del archivo es correcto
import authRoutes from './routes/auth.js';

const app = express();

const allowedOrigins = [
    'https://citas-app-frontend-eight.vercel.app',
    'http://localhost:3000'
];
const corsOptions = {
    origin: function (origin, callback) {
        // Permitimos peticiones sin origen (Postman, apps móviles, etc.)
        if (!origin) return callback(null, true);

        // Permitimos localhost:3000 para desarrollo
        if (origin === 'http://localhost:3000') {
            return callback(null, true);
        }

        // Creamos una expresión regular para validar los dominios de Vercel
        // Esto aceptará la URL de producción y cualquier URL de preview.
        const vercelRegex = /^https:\/\/citas-app-frontend-.*\.vercel\.app$/;
        if (vercelRegex.test(origin)) {
            return callback(null, true);
        }

        // Si el origen no coincide con nada de lo anterior, lo rechazamos.
        const msg = 'La política de CORS para este sitio no permite acceso desde el origen especificado.';
        return callback(new Error(msg), false);
    }
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);

app.get('/', (req, res) => res.send('API del Gestor de Citas funcionando'));

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        // Ejecuta esto UNA VEZ para re-crear las tablas correctamente.
        await sequelize.sync({ force: true });
        
        console.log('✅ Base de datos RE-CREADA y sincronizada.');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
    }
}

startServer();