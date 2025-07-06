// Archivo: backend/services/notificationService.js
// Propósito: Lógica para buscar citas y enviar recordatorios multi-canal (Push, Email, Socket.IO).

import { Op } from 'sequelize';
import { Cita, Usuario } from '../models/index.js';
import webpush from '../config/webpush.js';
import { enviarCorreoRecordatorio } from './emailService.js';

// --- INICIO DE LA CORRECCIÓN ---
// La función ahora acepta 'io' como un argumento, que será pasado desde index.js
export const revisarYEnviarRecordatorios = async (io) => {
// --- FIN DE LA CORRECCIÓN ---

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

            // --- Lógica para Notificaciones Push ---
            if (usuario.pushSubscription) {
                try {
                    const subscription = typeof usuario.pushSubscription === 'string'
                        ? JSON.parse(usuario.pushSubscription) : usuario.pushSubscription;
                    
                    if (subscription?.endpoint) {
                        const payload = JSON.stringify({
                            title: `🔔 Recordatorio: ${cita.titulo}`,
                            message: `Tu cita es a las ${new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`
                        });
                        await webpush.sendNotification(subscription, payload);
                        notificacionPushEnviada = true;
                        console.log(`[Push] Notificación enviada al usuario ${usuario.id}`);
                    }
                } catch (pushError) {
                    console.error(`[Push Error] Usuario ${usuario.id}:`, pushError.body || pushError.message);
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