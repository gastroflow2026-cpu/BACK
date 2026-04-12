import { registerAs } from '@nestjs/config';

export const typeOrmConfig = registerAs('typeorm', () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL no está definida en las variables de entorno',
    );
  }

  return {
    type: 'postgres' as const,
    url: databaseUrl,
    ssl: false,
    autoLoadEntities: true,
    synchronize: true,
    logging: true,
    dropSchema: false,
  };
});
