import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { env } from '../config/env.config';

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: Record<string, string | number | boolean>;
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

  const templatePath = path.join(__dirname, '../email/templates', `${options.template}.ejs`);
  const html = await ejs.renderFile(templatePath, options.data);

  const message = {
    from: `${env.FROM_NAME} <${env.SMTP_USER || env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html,
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};
