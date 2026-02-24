import { BadRequestError } from '../utils/errors';

const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export interface VerifyCaptchaResult {
  success: boolean;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verifica o token reCAPTCHA (v2 ou v3) com a API do Google.
 * RECAPTCHA_SECRET_KEY deve estar definida no ambiente.
 */
export async function verifyRecaptcha(token: string): Promise<void> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    throw new BadRequestError(
      'Captcha não configurado no servidor. Defina RECAPTCHA_SECRET_KEY.'
    );
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const res = await fetch(SITEVERIFY_URL, {
    method: 'POST',
    body: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const data = (await res.json()) as VerifyCaptchaResult;

  if (!data.success) {
    const codes = data['error-codes']?.join(', ') || 'unknown';
    throw new BadRequestError(
      `Captcha inválido ou expirado. Tente novamente. (${codes})`
    );
  }
}
