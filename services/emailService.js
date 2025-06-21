// Archivo: backend/services/emailService.js
// Propósito: Centralizar toda la lógica de envío de correos usando Nodemailer.

import nodemailer from 'nodemailer';

// Creamos un "transportador" reutilizable con las credenciales del .env.
// Este objeto se crea una sola vez cuando la aplicación se inicia.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Contraseña de aplicación de 16 caracteres de Google
    },
});

/**
 * Envía un correo de RECORDATORIO de cita.
 * @param {object} usuario - El objeto del usuario que contiene email y nombre.
 * @param {object} cita - El objeto de la cita que contiene título y fecha.
 */
export const enviarCorreoRecordatorio = async (usuario, cita) => {
    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'Gestor de Citas'}" <${process.env.EMAIL_USER}>`,
        to: usuario.email,
        subject: `🔔 Recordatorio de tu cita: ${cita.titulo}`,
        html: `
            <h1>Hola, ${usuario.nombre}!</h1>
            <p>Este es un recordatorio para tu próxima cita que está a punto de comenzar.</p>
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
        console.error(`[Email Error] No se pudo enviar el correo de recordatorio al usuario ${usuario.id}:`, error);
        // Re-lanzamos el error para que la función que llama sepa que falló.
        throw error;
    }
};

/**
 * Envía un correo de CONFIRMACIÓN cuando se crea una nueva cita.
 * @param {object} usuario - El objeto del usuario que contiene email y nombre.
 * @param {object} cita - El objeto de la nueva cita creada.
 */
export const enviarCorreoConfirmacion = async (usuario, cita) => {
    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'Gestor de Citas'}" <${process.env.EMAIL_USER}>`,
        to: usuario.email,
        subject: `✅ Cita Confirmada: ${cita.titulo}`,
        html: `
            <h1>¡Hola, ${usuario.nombre}!</h1>
            <p>Tu cita ha sido agendada con éxito en nuestro sistema.</p>
            <h3>Detalles de la Cita:</h3>
            <ul>
                <li><strong>Título:</strong> ${cita.titulo}</li>
                <li><strong>Fecha y Hora:</strong> ${new Date(cita.fecha).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</li>
                <li><strong>Descripción:</strong> ${cita.descripcion || 'Sin descripción.'}</li>
            </ul>
            <p>Recibirás un recordatorio 15 minutos antes de la cita. ¡Gracias por usar nuestro servicio!</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Correo de confirmación enviado a ${usuario.email} para la cita ${cita.id}`);
    } catch (error) {
        console.error(`[Email Error] No se pudo enviar el correo de confirmación al usuario ${usuario.id}:`, error);
        // No re-lanzamos el error aquí para no interrumpir el flujo principal de creación de cita.
        // Es un "nice-to-have", no un "must-have".
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
        replyTo: email_contact, // Importante para poder responderle directamente al usuario.
        subject: `Nuevo mensaje de contacto de: ${name}`,
        html: `
            <p>Has recibido un nuevo mensaje desde el formulario de contacto de tu aplicación.</p>
            <h3>Detalles del Contacto:</h3>
            <ul>
                <li><strong>Nombre:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email_contact}</li>
            </ul>
            <h3>Mensaje:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
        `,
    };

    // La palabra 'await' es importante para que el controlador que llama sepa cuándo terminó y pueda manejar errores.
    await transporter.sendMail(mailOptions); 
};