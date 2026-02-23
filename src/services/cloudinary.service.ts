import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import env from '../config/env';
import logger from '../utils/logger';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const WEBP_QUALITY = 85;
const MAX_DIMENSION = 1024;

function isConfigured(): boolean {
  return !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
}

function configure(): void {
  if (!isConfigured()) return;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

configure();

/**
 * Converte buffer de imagem para WebP (leve e adequado para logo).
 * Aceita JPEG, PNG, WebP, GIF.
 */
async function bufferToWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/**
 * Faz upload da logo no Cloudinary em WebP.
 * O arquivo enviado pode ser PNG/JPEG/etc.; é convertido para WebP antes do upload.
 */
export async function uploadLogo(
  buffer: Buffer,
  mimeType: string,
  barbershopId: string
): Promise<string> {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }

  if (!ALLOWED_MIMES.includes(mimeType)) {
    throw new Error(`Invalid image type. Allowed: ${ALLOWED_MIMES.join(', ')}`);
  }

  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error(`Image too large. Maximum size is ${MAX_SIZE_BYTES / 1024 / 1024} MB.`);
  }

  const webpBuffer = await bufferToWebp(buffer);

  const publicId = `barbershops/logos/${barbershopId}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          logger.error({ err: error }, 'Cloudinary upload failed');
          return reject(error);
        }
        if (!result?.secure_url) {
          return reject(new Error('Cloudinary did not return a URL'));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(webpBuffer);
  });
}
