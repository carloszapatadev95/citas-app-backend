// Archivo: backend/services/notificationService.js
// Propósito: Lógica para enviar recordatorios a clientes web y móviles.

import { Op } from 'sequelize';
import { Cita, Usuario } from '../models/index.js';
import webpush from '../config/webpush.js';
import { enviarCorreoRecordatorio } from './emailService.js';
import axios from 'axios';

export const revisarYEnviarRecordatorios = async (io) => {
    console.log(`[Scheduler] Ejecutando tarea de revisión de citas...`);
    try {
        const ahora = new Date();
        const limiteSuperior = new Date(ahora.getTime() + 15 * 60 * 1000);

        const citasProximas = await Cita.findAll({
            where: {
                fecha: { [Op.between]: [ahora, limiteSuperior] },
                recordatorioEnviado: false
            },
            include: [{ model: Usuario, where: { pushSubscription: { [Op.ne]: null } }, required: true }]
        });

        if (citasProximas.length === 0) return;

        console.log(`[Scheduler] Se encontraron ${citasProximas.length} citas para notificar.`);

        for (const cita of citasProximas) {
            const usuario = cita.Usuario;
            if (!usuario || !usuario.pushSubscription) continue;

            let notificacionEnviada = false;
            try {
                // 1. Obtenemos el string de la base de datos y lo parseamos a un objeto.
                const subscriptionData = JSON.parse(usuario.pushSubscription);
                
                const payload = {
                    title: `🔔 Recordatorio: ${cita.titulo}`,
                    body: `Tu cita es a las ${new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`
                };

                // 2. Comprobamos qué tipo de suscripción es y usamos el método correcto.
                if (subscriptionData.token && subscriptionData.token.startsWith('ExponentPushToken')) {
                    // Es de la APP MÓVIL
                    await axios.post('https://exp.host/--/api/v2/push/send', {
                        to: subscriptionData.token,
                        sound: 'default',
                        ...payload
                    });
                    console.log(`[Push Expo] Recordatorio enviado al usuario ${usuario.id}`);
                    notificacionEnviada = true;
                } else if (subscriptionData.endpoint) {
                    // Es de la WEB
                    await webpush.sendNotification(subscriptionData, JSON.stringify(payload));
                    console.log(`[Push Web] Recordatorio enviado al usuario ${usuario.id}`);
                    notificacionEnviada = true;
                }

                if(notificacionEnviada) {
                    // Enviamos correo y evento de socket solo si se pudo enviar la notificación push
                    enviarCorreoRecordatorio(usuario, cita).catch(console.error);
                    io.emit('recordatorio_cita', payload);
                    await cita.update({ recordatorioEnviado: true });
                }
            } catch (error) {
                console.error(`[Push/Email Error] Usuario ${usuario.id}:`, error.response?.data || error.message || error);
                if (error.response?.data?.details?.error === 'DeviceNotRegistered' || error.statusCode === 410) {
                    await Usuario.update({ pushSubscription: null }, { where: { id: usuario.id } });
                }
                await cita.update({ recordatorioEnviado: true });
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error crítico:', error);
    }
};