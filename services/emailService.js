// Archivo: backend/services/emailService.js
// Propósito: Centralizar toda la lógica de envío de correos.

import nodemailer from 'nodemailer';

// Creamos un "transportador" reutilizable con las credenciales del .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Envía un correo de recordatorio de cita.
 * @param {object} usuario - El objeto del usuario que contiene email y nombre.
 * @param {object} cita - El objeto de la cita que contiene título y fecha.
 */
export const enviarCorreoRecordatorio = async (usuario, cita) => {
    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'Gestor de Citas'}" <${process.env.EMAIL_USER}>`,
        to: usuario.email, // El destinatario es el email del usuario de la cita
        subject: `🔔 Recordatorio de tu cita: ${cita.titulo}`,
        html: `
            <h1>Hola, ${usuario.nombre}!</h1>
            <p>Este es un recordatorio para tu próxima cita.</p>
            <h3>Detalles de la Cita:</h3>
            <ul>
                <li><strong>Título:</strong> ${cita.titulo}</li>
                <li><strong>Fecha y Hora:</strong> ${new Date(cita.fecha).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</li>
                <li><strong>Descripción:</strong> ${cita.descripcion || 'Sin descripción.'}</li>
            </ul>
            <p>¡Que tengas un gran día!</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Correo de recordatorio enviado a ${usuario.email} para la cita ${cita.id}`);
    } catch (error) {
        console.error(`[Email Error] No se pudo enviar el correo al usuario ${usuario.id}:`, error);
    }
};

/**
 * Envía el correo del formulario de contacto.
 * @param {object} contactData - Datos del formulario ({ name, email_contact, message })
 */
export const enviarCorreoContacto = async (contactData) => {
    const { name, email_contact, message } = contactData;
    const fromName = process.env.MAIL_FROM_NAME || 'Formulario de Contacto';

    const mailOptions = {
        from: `"${fromName}" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        replyTo: email_contact,
        subject: `Nuevo mensaje de contacto de: ${name}`,
        html: `...`, // El mismo HTML que ya tenías
    };
    
    // La palabra 'await' es importante para que el controlador sepa cuándo terminó
    await transporter.sendMail(mailOptions); 
};