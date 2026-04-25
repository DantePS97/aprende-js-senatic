import { UserModel } from '../models/User.model';
import { generateResetToken, hashToken, RESET_TOKEN_TTL_MS } from '../lib/passwordReset';
import { emailService } from './email.service';

// ─── requestPasswordReset ─────────────────────────────────────────────────────

/**
 * Inicia el flujo de recuperación: genera token, lo guarda en DB y envía el email.
 * Si el email no existe, retorna silenciosamente (anti-enumeración).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select(
    '_id email displayName',
  );

  // Anti-enumeración: no revelamos si el email existe o no
  if (!user) return;

  const { rawToken, tokenHash, expiresAt } = generateResetToken();

  // CRÍTICO: usar updateOne, NO user.save()
  // El pre-save hook rehashea passwordHash si lo tiene en memoria.
  // updateOne bypasea el hook y solo toca los campos del token.
  await UserModel.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: expiresAt,
      },
    },
  );

  const resetUrl = `${process.env.APP_WEB_URL}/reset-password?token=${rawToken}`;

  // Errores de email se propagan al caller (route los loguea y devuelve 200 igual)
  await emailService.sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    expiresInMinutes: Math.round(RESET_TOKEN_TTL_MS / 60_000),
  });
}

// ─── validateResetToken ───────────────────────────────────────────────────────

/**
 * Verifica si un token raw es válido y no expiró.
 * Solo lectura — NO consume el token.
 */
export async function validateResetToken(
  rawToken: string,
): Promise<{ valid: boolean; email?: string }> {
  const tokenHash = hashToken(rawToken);

  const user = await UserModel.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetTokenExpiresAt email');

  if (!user) return { valid: false };

  return { valid: true, email: user.email };
}

// ─── resetPassword ────────────────────────────────────────────────────────────

/**
 * Consume el token y actualiza la contraseña.
 * Usa user.save() para que el pre-save hook hashee la nueva contraseña.
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const user = await UserModel.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetTokenExpiresAt');

  if (!user) {
    const err = new Error('Token inválido o expirado.') as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  // Asignamos la contraseña en texto plano — el pre-save hook la hashea
  user.passwordHash = newPassword;
  // Limpiamos el token para que sea de un solo uso
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpiresAt = undefined;

  // save() aquí es correcto: queremos que el hook rehashee la contraseña
  await user.save();
}
