// Archivo: backend/services/notificationService.js
// Propósito: Lógica para buscar citas y enviar recordatorios multi-canal,
// ahora compatible con tokens de Expo y suscripciones web.

import { Op } from 'sequelize';
import { Cita, Usuario } from '../models/index.js';
import webpush from '../config/webpush.js';
import { enviarCorreoRecordatorio } from './emailService.js';
import axios from 'axios';

/**
 * Función principal que se ejecuta periódicamente para revisar y enviar recordatorios.
 * @param {object} io - La instancia del servidor de Socket.IO para notificaciones en la UI.
 */
export const revisarYEnviarRecordatorios = async (io) => {
    console.log(`[Scheduler] Ejecutando tarea de revisión de citas... ${new Date().toLocaleTimeString()}`);
    
    try {
        // 1. Definir el rango de tiempo (citas en los próximos 15 minutos)
        const ahora = new Date();
        const limiteSuperior = new Date(ahora.getTime() + 15 * 60 * 1000);

        // 2. Buscar citas que cumplan los criterios
        const citasProximas = await Cita.findAll({
            where: {
                fecha: { [Op.between]: [ahora, limiteSuperior] },
                recordatorioEnviado: false
            },
            // Incluimos el modelo Usuario para obtener sus datos de contacto y suscripción
            include: [{
                model: Usuario,
                // Solo nos interesan las citas de usuarios que tienen una suscripción push
                where: { pushSubscription: { [Op.ne]: null } }, 
                attributes: ['id', 'nombre', 'email', 'pushSubscription'],
                required: true // Asegura que solo se devuelvan citas con un usuario que coincida (INNER JOIN)
            }]
        });

        if (citasProximas.length === 0) {
            console.log('[Scheduler] No hay citas próximas para notificar.');
            return;
        }

        console.log(`[Scheduler] Se encontraron ${citasProximas.length} citas para notificar.`);

        // 3. Iterar sobre cada cita y enviar las notificaciones
        for (const cita of citasProximas) {
            const usuario = cita.Usuario;
            if (!usuario) continue;

            let notificacionPushEnviada = false;
            let correoEnviado = false;
            let eventoSocketEnviado = false;

            const subscriptionData = usuario.pushSubscription;

            try {
                // --- A. LÓGICA PARA NOTIFICACIONES PUSH ---
                const payload = {
                    title: `🔔 Recordatorio: ${cita.titulo}`,
                    body: `Tu cita es a las ${new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`
                };
                
                // Comprobamos si es un token de Expo (string) o una suscripción web (objeto)
                if (typeof subscriptionData === 'string' && subscriptionData.startsWith('ExponentPushToken[')) {
                    // Es un token de Expo, usamos la API de Expo
                    await axios.post('https://exp.host/--/api/v2/push/send', {
                        to: subscriptionData,
                        sound: 'default',
                        ...payload
                    });
                    console.log(`[Push Expo] Recordatorio enviado al usuario ${usuario.id}`);
                    notificacionPushEnviada = true;

                } else if (typeof subscriptionData === 'object' && subscriptionData.endpoint) {
                    // Es una suscripción web, usamos web-push
                    await webpush.sendNotification(subscriptionData, JSON.stringify(payload));
                    console.log(`[Push Web] Recordatorio enviado al usuario ${usuario.id}`);
                    notificacionPushEnviada = true;
                }

                // --- B. LÓGICA PARA NOTIFICACIONES POR CORREO ---
                await enviarCorreoRecordatorio(usuario, cita);
                correoEnviado = true;

                // --- C. LÓGICA PARA NOTIFICACIONES EN UI (SOCKET.IO) ---
                io.emit('recordatorio_cita', {
                    title: payload.title,
                    message: payload.body
                });
                eventoSocketEnviado = true;
                console.log(`[Socket.IO] Evento 'recordatorio_cita' emitido para la cita ${cita.id}`);

                // --- D. MARCAR CITA COMO NOTIFICADA ---
                if (notificacionPushEnviada || correoEnviado || eventoSocketEnviado) {
                    await cita.update({ recordatorioEnviado: true });
                    console.log(`[Scheduler] Recordatorios procesados para la cita ${cita.id}`);
                }

            } catch (error) {
                console.error(`[Push/Email Error] Usuario ${usuario.id}:`, error.response?.data || error.message || error);
                // Si el error es por una suscripción expirada, la limpiamos.
                if (error.response?.data?.details?.error === 'DeviceNotRegistered' || error.statusCode === 410) {
                    console.log(`[Push] Eliminando suscripción inválida para el usuario ${usuario.id}.`);
                    await Usuario.update({ pushSubscription: null }, { where: { id: usuario.id } });
                }
                // Marcamos la cita como notificada para no intentar enviarla de nuevo si hay un error persistente.
                await cita.update({ recordatorioEnviado: true });
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error crítico durante la revisión de recordatorios:', error);
    }
};