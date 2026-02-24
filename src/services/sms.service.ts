import logger from '../utils/logger';
import env from '../config/env';

type EnvWithTwilio = typeof env & {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
};

const envTwilio = process.env as unknown as EnvWithTwilio;

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
    } catch (err) {
      logger.error({ err, to: phone }, 'Failed to send SMS');
      throw err;
    }
  } else {
    logger.info(
      { code, phone: phone.replace(/\d(?=\d{4})/g, '*') },
      'SMS not configured: verification code (use in development)'
    );
  }
}
