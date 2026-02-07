import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

// Carrega .env de apps/api (evita usar o .env da raiz ao rodar com pnpm --filter)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Env = z.object({
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  AUTH_SECRET: z.string().default('replace-me-with-random'),
  APP_URL: z.string().default('http://localhost:3000'),
});

export const env = Env.parse(process.env);
