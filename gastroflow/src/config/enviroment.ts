import * as dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';
dotenv.config({ path: '.env.development' });

const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ||
  '1h') as SignOptions['expiresIn'];

export const environment = {
  HOST: process.env.HOST || 'localhost',
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  FRONTEND_AUTH_REDIRECT_URL:
    process.env.FRONTEND_AUTH_REDIRECT_URL ||
    process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
    'http://localhost:3001',

  DATABASE_URL: process.env.DATABASE_URL,

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: jwtExpiresIn,

  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,

  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD,
  MAIL_FROM: process.env.MAIL_FROM,

  STRIPE_PRICE_BASIC_MONTHLY: process.env.STRIPE_PRICE_BASIC_MONTHLY,
  STRIPE_PRICE_BASIC_YEARLY: process.env.STRIPE_PRICE_BASIC_YEARLY,
  STRIPE_PRICE_PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  STRIPE_PRICE_PREMIUM_YEARLY: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS:
    process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS,
};
