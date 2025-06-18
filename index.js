// backend/index.js (ACTUALIZADO CON SEQUELIZE)

import express from 'express';
import cors from 'cors';

// 1. Importar Sequelize y la configuración de la base de datos
import sequelize from './config/database.js';

// 2. Importar nuestro modelo (aunque no lo usemos directamente aquí, es necesario para que se registre)
import Cita from './models/Cita.js';

// 3. Importar las rutas de citas (aunque no las usemos directamente aquí, es necesario para que se registren)
import citasRoutes from './routes/citasRoutes.js'; // Descomentar si se usan las rutas

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/citas', citasRoutes);

app.get('/', (req, res) => {
    res.send('¡Hola desde el servidor backend de Citas! (API Lista)');
});

const PORT = 4000;

// 3. Función principal para arrancar el servidor y la base de datos
async function startServer() {
    try {
        // Autenticar la conexión a la base de datos
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');

        // Sincronizar los modelos con la base de datos
        // Esto creará la tabla 'Citas' si no existe
        await sequelize.sync({ force: false }); // force: true borraría la tabla y la volvería a crear
        console.log('Todos los modelos fueron sincronizados exitosamente.');

        // Una vez sincronizado, ponemos el servidor a escuchar
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
    }
}

// Llamamos a la función para iniciar todo
startServer();