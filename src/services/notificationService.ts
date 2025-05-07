import nodemailer, { SendMailOptions } from 'nodemailer';
import config from '../../config.json';

const smtpConfig = config.smtp;

const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: false, // true para puertos 465, false para otros
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.password
  }
});

/**
 * Envía un email, opcionalmente con adjuntos.
 * @param to       Destinatario
 * @param subject  Asunto
 * @param text     Texto plano
 * @param html     HTML opcional
 * @param attachments  Array de adjuntos (objetos con filename y path)
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: { filename: string; path: string }[]
) {
  const mailOptions: SendMailOptions = {
    from: smtpConfig.from,
    to,
    subject,
    text,
    html,
    attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado:', info.response);
    return info;
  } catch (error) {
    console.error('Error enviando correo:', error);
    throw error;
  }
}
