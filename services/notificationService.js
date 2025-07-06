// Archivo: backend/services/notificationService.js
// Propósito: Lógica para enviar recordatorios, ahora optimizada solo para Expo Push Tokens.

import { Op } from 'sequelize';
import { Cita, Usuario } from '../models/index.js';
import { enviarCorreoRecordatorio } from './emailService.js';
import axios from 'axios';
// Ya no se necesita la librería 'web-push'.

/**
 * Función principal que se ejecuta periódicamente para revisar y enviar recordatorios.
 * @param {object} io - La instancia del servidor de Socket.IO.
 */
export const revisarYEnviarRecordatorios = async (io) => {
    console.log(`[Scheduler] Ejecutando tarea de revisión de citas... ${new Date().toLocaleTimeString()}`);
    
    try {
        // 1. Definir el rango de tiempo.
        const ahora = new Date();
        const limiteSuperior = new Date(ahora.getTime() + 15 * 60 * 1000);

        // 2. Buscar las citas próximas de usuarios que tengan una suscripción guardada.
        const citasProximas = await Cita.findAll({
            where: {
                fecha: { [Op.between]: [ahora, limiteSuperior] },
                recordatorioEnviado: false
            },
            include: [{
                model: Usuario,
                where: { pushSubscription: { [Op.ne]: null } },
                attributes: ['id', 'nombre', 'email', 'pushSubscription'],
                required: true
            }]
        });

        // 3. Si no hay citas, terminar la ejecución de forma eficiente.
        if (citasProximas.length === 0) {
            console.log('[Scheduler] No hay citas próximas para notificar.');
            return;
        }

        console.log(`[Scheduler] Se encontraron ${citasProximas.length} citas para notificar.`);

        // 4. Procesar cada cita encontrada.
        for (const cita of citasProximas) {
            const usuario = cita.Usuario;
            // Doble verificación por seguridad.
            if (!usuario || !usuario.pushSubscription) continue;

            let notificacionEnviada = false;
            try {
                // El dato de la BD es el string del token de Expo.
                const expoPushToken = usuario.pushSubscription;
                
                const payload = {
                    title: `🔔 Recordatorio: ${cita.titulo}`,
                    body: `Tu cita es a las ${new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`
                };

                // Verificamos que sea un token de Expo válido antes de enviarlo.
                if (typeof expoPushToken === 'string' && expoPushToken.startsWith('ExponentPushToken')) {
                    // Usamos axios para enviar la notificación a la API de Expo.
                    await axios.post('https://exp.host/--/api/v2/push/send', {
                        to: expoPushToken,
                        sound: 'default',
                        title: payload.title,
                        body: payload.body,
                        data: { citaId: cita.id } // Datos extra por si la app necesita saber a qué cita se refiere
                    });
                    
                    console.log(`[Push Expo] Recordatorio enviado al usuario ${usuario.id} para la cita ${cita.id}`);
                    notificacionEnviada = true;
                }

                // Si la notificación push fue exitosa, procedemos con los otros canales.
                if (notificacionEnviada) {
                    // Enviar correo electrónico
                    enviarCorreoRecordatorio(usuario, cita).catch(console.error);

                    // Enviar notificación a la UI a través de Socket.IO
                    io.emit('recordatorio_cita', payload);

                    // Finalmente, marcamos la cita como notificada para no volver a enviarla.
                    await cita.update({ recordatorioEnviado: true });
                    console.log(`[Scheduler] Recordatorios procesados para la cita ${cita.id}`);
                }
                
            } catch (error) {
                console.error(`[Push/Email Error] al procesar para el usuario ${usuario.id}:`, error.response?.data || error.message);
                
                // Si el error es porque el token del dispositivo ya no es válido, lo borramos.
                if (error.response?.data?.details?.error === 'DeviceNotRegistered') {
                    console.log(`[Push] Eliminando token inválido para el usuario ${usuario.id}.`);
                    await Usuario.update({ pushSubscription: null }, { where: { id: usuario.id } });
                }
                // Marcamos la cita como notificada de todos modos para no quedar en un bucle de error.
                await cita.update({ recordatorioEnviado: true });
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error crítico durante la revisión de recordatorios:', error);
    }
};