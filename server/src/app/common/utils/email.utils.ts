import nodemailer from 'nodemailer';
import { env } from '../config/env.config';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(env.SMTP_PORT || "587"),
    auth: {
      user: env.SMTP_USER || "test@ethereal.email",
      pass: env.SMTP_PASS || "testpassword",
    },
  });

  const message = {
    from: `${env.FROM_NAME} <${env.SMTP_USER || env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};
