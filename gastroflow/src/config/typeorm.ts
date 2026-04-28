import { registerAs } from '@nestjs/config';
import { environment } from './enviroment';

export const typeOrmConfig = registerAs('typeorm', () => ({
  type: 'postgres',
  url: environment.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
  autoLoadEntities: true,
  synchronize: false,
  logging: true,
  dropSchema: false,
}));
