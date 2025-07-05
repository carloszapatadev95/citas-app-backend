// Archivo: backend/services/notificationService.js
// Propósito: Lógica para enviar recordatorios, ahora compatible con Expo Push Tokens.

import { Op } from 'sequelize';
import { Cita, Usuario } from '../models/index.js';
import axios from 'axios'; // Usaremos axios para hablar con el servidor de Expo

export const revisarYEnviarRecordatorios = async (io) => {
    console.log(`[Scheduler] Ejecutando tarea...`);
    try {
        const ahora = new Date();
        const limiteSuperior = new Date(ahora.getTime() + 15 * 60 * 1000);

        const citasProximas = await Cita.findAll({ /* ... (sin cambios) ... */ });

        if (citasProximas.length === 0) return;

        console.log(`[Scheduler] Se encontraron ${citasProximas.length} citas para notificar.`);

        for (const cita of citasProximas) {
            const usuario = cita.Usuario;
            if (!usuario || !usuario.pushSubscription) continue;

            try {
                // --- INICIO DE LA LÓGICA PARA EXPO PUSH ---
                // pushSubscription es un string como "ExponentPushToken[...]"
                const pushToken = usuario.pushSubscription;

                // Verificamos si es un token válido de Expo
                if (typeof pushToken === 'string' && pushToken.startsWith('ExponentPushToken[')) {
                    await axios.post('https://exp.host/--/api/v2/push/send', {
                        to: pushToken,
                        sound: 'default',
                        title: `🔔 Recordatorio: ${cita.titulo}`,
                        body: `Tu cita es a las ${new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`,
                        data: { citaId: cita.id }, // Datos extra que la app puede usar
                    }, {
                        headers: {
                            'Accept': 'application/json',
                            'Accept-encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                    });
                    console.log(`[Push Expo] Notificación enviada al usuario ${usuario.id}`);
                } else {
                    console.warn(`[Push] La suscripción para el usuario ${usuario.id} no es un token de Expo válido.`);
                }
                // --- FIN DE LA LÓGICA PARA EXPO PUSH ---
                
                await cita.update({ recordatorioEnviado: true });

            } catch (error) {
                // El error de axios es más detallado
                console.error(`[Push Error] Usuario ${usuario.id}:`, error.response?.data || error.message);
                // Si el token ya no es válido, Expo devuelve un error específico
                if (error.response?.data?.details?.error === 'DeviceNotRegistered') {
                    console.log(`[Push] Eliminando token inválido para el usuario ${usuario.id}`);
                    await Usuario.update({ pushSubscription: null }, { where: { id: usuario.id } });
                }
                await cita.update({ recordatorioEnviado: true });
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error crítico:', error);
    }
};