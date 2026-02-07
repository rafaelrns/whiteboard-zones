/**
 * Deve ser o primeiro import no entrypoint (server.ts).
 * Garante que apps/api/.env seja carregado antes do Prisma ou de qualquer rota.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
