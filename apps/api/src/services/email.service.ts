import { Resend } from 'resend';

const APP_WEB_URL = process.env.APP_WEB_URL ?? 'https://aprende.senatic.app';

// ─── Interfaz ────────────────────────────────────────────────────────────────

export interface EmailService {
  sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): Promise<void>;

  sendAchievementEmail(params: {
    to: string;
    displayName: string;
    achievementTitle: string;
    achievementEmoji: string;
    achievementDescription: string;
  }): Promise<void>;

  sendLevelUpEmail(params: {
    to: string;
    displayName: string;
    newLevel: number;
  }): Promise<void>;

  sendStreakMilestoneEmail(params: {
    to: string;
    displayName: string;
    streakDays: number;
  }): Promise<void>;

  sendStreakReminderEmail(params: {
    to: string;
    displayName: string;
    streakDays: number;
  }): Promise<void>;
}

// ─── Template HTML ────────────────────────────────────────────────────────────

function buildResetEmailHtml(resetUrl: string, expiresInMinutes: number): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px;background-color:#1e293b;border-radius:12px;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #334155;">
                  <div style="font-size:36px;margin-bottom:8px;">💻</div>
                  <h1 style="margin:0;color:#f8fafc;font-size:20px;font-weight:700;">SENATIC</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:32px 40px;">
                  <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.6;">Hola,</p>
                  <p style="margin:0 0 24px;color:#cbd5e1;font-size:15px;line-height:1.6;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta SENATIC.
                    Haz clic en el botón de abajo para crear una nueva contraseña.
                  </p>
                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="padding:8px 0 28px;">
                        <a href="${resetUrl}"
                           style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:15px;
                                  font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                          Restablecer contraseña
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 16px;color:#94a3b8;font-size:13px;line-height:1.6;">
                    Este enlace expira en <strong style="color:#cbd5e1;">${expiresInMinutes} minutos</strong>.
                  </p>
                  <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                    Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid #334155;">
                  <p style="margin:0;color:#64748b;font-size:12px;">Equipo SENATIC</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim();
}

function buildNotificationEmailHtml(params: {
  emoji: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  const { emoji, heading, body, ctaLabel, ctaUrl } = params;
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px;background-color:#1e293b;border-radius:12px;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #334155;">
                  <div style="font-size:36px;margin-bottom:8px;">💻</div>
                  <h1 style="margin:0;color:#f8fafc;font-size:20px;font-weight:700;">SENATIC</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:32px 40px;">
                  <div style="text-align:center;font-size:48px;margin-bottom:16px;">${emoji}</div>
                  <h2 style="margin:0 0 16px;color:#f8fafc;font-size:18px;font-weight:700;text-align:center;">${heading}</h2>
                  <p style="margin:0 0 24px;color:#cbd5e1;font-size:15px;line-height:1.6;">${body}</p>
                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="padding:8px 0 28px;">
                        <a href="${ctaUrl}"
                           style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:15px;
                                  font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                          ${ctaLabel}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid #334155;">
                  <p style="margin:0;color:#64748b;font-size:12px;">Equipo SENATIC</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim();
}

// ─── Implementación con Resend ────────────────────────────────────────────────

export class ResendEmailService implements EmailService {
  private readonly resend: Resend;

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): Promise<void> {
    const { to, resetUrl, expiresInMinutes } = params;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Recupera tu contraseña — SENATIC',
      html: buildResetEmailHtml(resetUrl, expiresInMinutes),
    });

    if (error) {
      throw new Error(`[email.service] Resend error: ${error.message}`);
    }
  }

  async sendAchievementEmail(params: {
    to: string;
    displayName: string;
    achievementTitle: string;
    achievementEmoji: string;
    achievementDescription: string;
  }): Promise<void> {
    const { to, displayName, achievementTitle, achievementEmoji, achievementDescription } = params;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `🏆 ¡Desbloqueaste un logro: ${achievementTitle}!`,
      html: buildNotificationEmailHtml({
        emoji: achievementEmoji,
        heading: `¡Desbloqueaste un logro!`,
        body: `¡Bien hecho, ${displayName}! Acabas de desbloquear el logro <strong>${achievementEmoji} ${achievementTitle}</strong>. ${achievementDescription}. ¡Seguí así!`,
        ctaLabel: 'Ver mis logros',
        ctaUrl: `${APP_WEB_URL}/profile`,
      }),
    });

    if (error) {
      throw new Error(`[email.service] Resend error: ${error.message}`);
    }
  }

  async sendLevelUpEmail(params: {
    to: string;
    displayName: string;
    newLevel: number;
  }): Promise<void> {
    const { to, displayName, newLevel } = params;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `⚡ ¡Subiste al nivel ${newLevel}!`,
      html: buildNotificationEmailHtml({
        emoji: '⚡',
        heading: `¡Subiste al nivel ${newLevel}!`,
        body: `¡Felicitaciones, ${displayName}! Alcanzaste el <strong>nivel ${newLevel}</strong>. Tu esfuerzo está dando frutos.`,
        ctaLabel: 'Ver mi progreso',
        ctaUrl: `${APP_WEB_URL}/courses`,
      }),
    });

    if (error) {
      throw new Error(`[email.service] Resend error: ${error.message}`);
    }
  }

  async sendStreakMilestoneEmail(params: {
    to: string;
    displayName: string;
    streakDays: number;
  }): Promise<void> {
    const { to, displayName, streakDays } = params;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `🔥 ¡${streakDays} días de racha!`,
      html: buildNotificationEmailHtml({
        emoji: '🔥',
        heading: `¡${streakDays} días de racha!`,
        body: `¡Increíble, ${displayName}! Llevas <strong>${streakDays} días seguidos</strong> aprendiendo. ¡No pares ahora!`,
        ctaLabel: 'Continuar aprendiendo',
        ctaUrl: `${APP_WEB_URL}/courses`,
      }),
    });

    if (error) {
      throw new Error(`[email.service] Resend error: ${error.message}`);
    }
  }

  async sendStreakReminderEmail(params: {
    to: string;
    displayName: string;
    streakDays: number;
  }): Promise<void> {
    const { to, displayName, streakDays } = params;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `⏰ Tu racha de ${streakDays} días está en riesgo`,
      html: buildNotificationEmailHtml({
        emoji: '⏰',
        heading: `Tu racha está en riesgo`,
        body: `¡Hola ${displayName}! Llevas <strong>${streakDays} días de racha</strong> pero aún no completaste una lección hoy. ¡Tienes tiempo! No pierdas tu racha.`,
        ctaLabel: 'Completar lección',
        ctaUrl: `${APP_WEB_URL}/courses`,
      }),
    });

    if (error) {
      throw new Error(`[email.service] Resend error: ${error.message}`);
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const emailService: EmailService = new ResendEmailService(
  process.env.RESEND_API_KEY!,
  process.env.EMAIL_FROM ?? 'SENATIC <no-reply@senatic.app>',
);
