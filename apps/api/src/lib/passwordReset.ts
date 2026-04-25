import crypto from 'crypto';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

/**
 * Genera un token de reset seguro.
 * rawToken  → se envía al usuario por email (nunca se guarda en DB)
 * tokenHash → SHA-256 del rawToken, lo que se almacena en DB
 * expiresAt → timestamp de expiración (1 hora desde ahora)
 */
export function generateResetToken(): {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const rawToken = crypto.randomBytes(32).toString('hex'); // 64 chars hex
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return { rawToken, tokenHash, expiresAt };
}

/**
 * Hashea un token raw con SHA-256.
 * Usado tanto al guardar como al verificar el token incoming.
 */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
