import { registerAs} from '@nestjs/config';
import { environment } from './enviroment';

export const typeOrmConfig = registerAs('typeorm', () => ({
  type: 'postgres',
  database: environment.DB_NAME,
  // host:'postgresdb',
  host: environment.DB_HOST,
  port: Number(environment.DB_PORT),
  username: environment.DB_USERNAME,
  password: environment.DB_PASSWORD,
  entities: ['dist/*/.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  synchronize: true,
  logging: false,
  dropSchema: false, // false: se quedan los datos, true se borran los datos
}));