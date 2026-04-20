import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

export const environment = {
  HOST: process.env.HOST || 'localhost',
  PORT: process.env.PORT || 3000,

  DATABASE_URL: process.env.DATABASE_URL,

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  JWT_SECRET: process.env.JWT_SECRET,

  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
};
