
import './config.js';
import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index.js'; 
import citasRoutes from './routes/citasRoutes.js';
import authRoutes from './routes/auth.js';

const app = express();


const allowedOrigins = [
    'https://citas-app-frontend-eight.vercel.app', // Tu frontend en producción
    'http://localhost:3000'                      // Tu frontend en desarrollo (Vite)
];


const corsOptions = {
    origin: function (origin, callback) {

        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'La política de CORS para este sitio no permite acceso desde el origen especificado.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};
app.use(cors(corsOptions));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);


app.get('/', (req, res) => {
    res.send('¡API del Gestor de Citas funcionando correctamente!');
});


const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
  
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