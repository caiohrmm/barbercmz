import logger from '../utils/logger';
import env from '../config/env';
import { ServiceUnavailableError } from '../utils/errors';

type EnvWithTwilio = typeof env & {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
};

const envTwilio = process.env as unknown as EnvWithTwilio;

/** Twilio error 21659: From number is not a Twilio number (must buy/rent in Twilio console). */
const TWILIO_CODE_INVALID_FROM = 21659;

/**
 * Sends an SMS with the verification code.
 * If Twilio is not configured, logs the code to the console (development).
 */
export async function sendVerificationSms(phone: string, code: string): Promise<void> {
  const body = `Seu código de confirmação BarberCMZ: ${code}. Válido por 10 minutos. Não compartilhe.`;

  if (
    envTwilio.TWILIO_ACCOUNT_SID &&
    envTwilio.TWILIO_AUTH_TOKEN &&
    envTwilio.TWILIO_PHONE_NUMBER
  ) {
    try {
      const twilio = await import('twilio');
      const client = twilio.default(
        envTwilio.TWILIO_ACCOUNT_SID,
        envTwilio.TWILIO_AUTH_TOKEN
      );
      await client.messages.create({
        body,
        to: phone,
        from: envTwilio.TWILIO_PHONE_NUMBER,
      });
      logger.info({ to: phone.replace(/\d(?=\d{4})/g, '*') }, 'SMS verification sent');
    } catch (err: unknown) {
      logger.error({ err, to: phone }, 'Failed to send SMS');
      const twilioCode = (err as { code?: number })?.code;
      if (twilioCode === TWILIO_CODE_INVALID_FROM) {
        throw new ServiceUnavailableError(
          'SMS temporariamente indisponível. O número de envio (From) deve ser um número comprado no console da Twilio, não um número pessoal. Veja: https://www.twilio.com/docs/errors/21659'
        );
      }
      throw err;
    }
  } else {
    logger.info(
      { code, phone: phone.replace(/\d(?=\d{4})/g, '*') },
      'SMS not configured: verification code (use in development)'
    );
  }
}
