import { api } from '@/lib/api';
import type { AxiosError } from 'axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ error?: string }>;
  return axiosErr.response?.data?.error ?? fallback;
}

// ─── forgotPassword ───────────────────────────────────────────────────────────

/**
 * Solicita el envío de un email de recuperación de contraseña.
 * El backend siempre devuelve 200 (anti-enumeración), así que esta función
 * solo rechaza en errores de red o 5xx.
 */
export async function forgotPassword(email: string): Promise<void> {
  try {
    await api.post('/auth/forgot-password', { email });
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Error de red. Intenta de nuevo.'));
  }
}

// ─── validateResetToken ───────────────────────────────────────────────────────

/**
 * Verifica si un token de reset es válido y no ha expirado.
 * Devuelve false si el token es inválido o expiró (400).
 * Lanza error solo en fallos de red o errores inesperados.
 */
export async function validateResetToken(token: string): Promise<boolean> {
  try {
    const { data } = await api.get<{ success: boolean; data: { valid: boolean } }>(
      `/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
    );
    return data.data.valid;
  } catch (err) {
    const axiosErr = err as AxiosError;
    // 400 = token inválido o expirado → no es un error de red, devolvemos false
    if (axiosErr.response?.status === 400) return false;
    throw new Error(extractErrorMessage(err, 'Error de red. Intenta de nuevo.'));
  }
}

// ─── resetPassword ────────────────────────────────────────────────────────────

/**
 * Consume el token de reset y actualiza la contraseña.
 * Lanza error con mensaje en español si el token es inválido, expiró o falla la red.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  try {
    await api.post('/auth/reset-password', { token, newPassword });
  } catch (err) {
    throw new Error(
      extractErrorMessage(err, 'Error de red. Intenta de nuevo.'),
    );
  }
}
