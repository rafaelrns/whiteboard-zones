import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';

export function applySecurity(app: Express) {
  app.disable('x-powered-by');

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const origins = corsOrigin.split(',').map((s) => s.trim());
  app.use(
    cors({
      origin: (o, cb) => {
        if (!o) return cb(null, true);
        if (origins.includes(o)) return cb(null, o);
        return cb(null, origins[0]);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: false, // MVP: canvas + dev tooling
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );
}
