// Archivo: backend/services/notificationService.js
// Propósito: Lógica para buscar citas y enviar recordatorios multi-canal (Push, Email, Socket.IO).

import { Op } from 'sequelize';
import { Cita, Usuario } from '../models/index.js';
import webpush from '../config/webpush.js';
import { enviarCorreoRecordatorio } from './emailService.js';
import axios from 'axios';


// --- NUEVA FUNCIÓN AUXILIAR PARA ENVIAR NOTIFICACIONES EXPO ---
const enviarNotificacionExpo = async (expoPushToken, cita) => {
    const message = {
        to: expoPushToken,
        sound: 'default', // Esto hace que el dispositivo vibre y suene
        title: `🔔 Recordatorio: ${cita.titulo}`,
        body: `Tu cita es a las ${new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`,
        data: { citaId: cita.id }, // Puedes enviar datos adicionales
    };

    try {
        await axios.post('https://exp.host/--/api/v2/push/send', message, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        });
        console.log(`[Expo Push] Notificación enviada para el token ${expoPushToken.substring(0, 20)}...`);
        return true;
    } catch (error) {
        console.error(`[Expo Push Error] No se pudo enviar la notificación:`, error.response?.data || error.message);
        return false;
    }
};


// La función ahora acepta 'io' como un argumento, que será pasado desde index.js
export const revisarYEnviarRecordatorios = async (io) => {

    console.log(`[Scheduler] Ejecutando tarea de revisión de citas... ${new Date().toLocaleTimeString()}`);
    
    try {
        const ahora = new Date();
        const limiteSuperior = new Date(ahora.getTime() + 15 * 60 * 1000);

        const citasProximas = await Cita.findAll({
            where: {
                fecha: { [Op.between]: [ahora, limiteSuperior] },
                recordatorioEnviado: false
            },
            include: [{
                model: Usuario,
                attributes: ['id', 'nombre', 'email', 'pushSubscription'],
                required: true
            }]
        });

        if (citasProximas.length === 0) {
            console.log('[Scheduler] No hay citas próximas para notificar.');
            return;
        }

        console.log(`[Scheduler] Se encontraron ${citasProximas.length} citas para notificar.`);

        for (const cita of citasProximas) {
            const usuario = cita.Usuario;
            if (!usuario) continue;

            let notificacionPushEnviada = false;
            let correoEnviado = false;
            let eventoSocketEnviado = false;

             // --- LÓGICA DE NOTIFICACIÓN MULTICANAL MEJORADA ---

            // 1. Notificación Push Web (si existe suscripción web)
            if (usuario.pushSubscription.web?.endpoint) {
                try {
                    const payload = JSON.stringify({
                        title: `🔔 Recordatorio: ${cita.titulo}`,
                        message: `Tu cita es a las ${new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`
                    });
                    await webpush.sendNotification(usuario.pushSubscription.web, payload);
                    notificacionPushEnviada = true;
                    console.log(`[Web Push] Notificación enviada al usuario ${usuario.id}`);
                } catch (pushError) {
                    console.error(`[Web Push Error] Usuario ${usuario.id}:`, pushError.body || pushError.message);
                }
            }

            // 2. Notificación Push Nativa (si existe token de expo)
            if (usuario.pushSubscription.expo) {
                const enviadaConExito = await enviarNotificacionExpo(usuario.pushSubscription.expo, cita);
                if (enviadaConExito) {
                    notificacionPushEnviada = true;
                }
            }
            // --- Lógica para Notificaciones por Correo ---
            try {
                await enviarCorreoRecordatorio(usuario, cita);
                correoEnviado = true;
            } catch (emailError) {
                // El error ya se loguea dentro de emailService
            }
            
            // --- Lógica para Notificaciones en UI (Socket.IO) ---
            try {
                // Ahora 'io' está definido porque es un argumento de la función
                io.emit('recordatorio_cita', {
                    title: `Recordatorio: ${cita.titulo}`,
                    message: `Tu cita es en menos de 15 minutos.`
                });
                eventoSocketEnviado = true;
                console.log(`[Socket.IO] Evento 'recordatorio_cita' emitido para la cita ${cita.id}`);
            } catch (socketError) {
                console.error(`[Socket.IO Error] No se pudo emitir el evento para la cita ${cita.id}:`, socketError);
            }


            // --- Marcar la cita como notificada ---
            if (notificacionPushEnviada || correoEnviado || eventoSocketEnviado) {
                await cita.update({ recordatorioEnviado: true });
                console.log(`[Scheduler] Recordatorios procesados para la cita ${cita.id}`);
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error crítico durante la revisión de recordatorios:', error);
    }
};