import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Por ejemplo, smtp.gmail.com
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM, // Dirección del remitente
    to,
    subject,
    text,
    html
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
