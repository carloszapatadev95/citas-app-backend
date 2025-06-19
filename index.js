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
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy does not allow access from this origin.'));
        }
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
        await sequelize.sync({ force: false });
        
        console.log('✅ Base de datos RE-CREADA y sincronizada.');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
    }
}

startServer();