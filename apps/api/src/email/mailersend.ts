import { env } from '../env.js';

const MAILERSEND_URL = 'https://api.mailersend.com/v1/email';

export type SendEmailParams = {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text?: string;
};

/** Envia email via MailerSend. Retorna true se enviado, false se email desabilitado. */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const token = env.MAILERSEND_API_TOKEN;
  const fromEmail = env.MAILERSEND_FROM_EMAIL;
  if (!token || !fromEmail) return false;

  const res = await fetch(MAILERSEND_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { email: fromEmail, name: 'Whiteboard Zones' },
      to: [{ email: params.to.email, name: params.to.name ?? params.to.email }],
      subject: params.subject,
      html: params.html,
      text: params.text ?? params.html.replace(/<[^>]+>/g, ''),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[MailerSend] Erro ao enviar email:', res.status, err);
    throw new Error(`MailerSend: ${res.status}`);
  }
  return true;
}
