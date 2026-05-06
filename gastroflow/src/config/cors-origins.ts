import { environment } from './enviroment';

export const getAllowedCorsOrigins = (): string[] =>
  environment.FRONTEND_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
