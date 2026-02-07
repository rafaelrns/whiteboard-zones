import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './observability/logger.js';
import { inc, snapshot } from './observability/metrics.js';
import { applySecurity } from './security.js';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './env.js';
import { loadOpenApiSpec } from './openapi.js';

import { authRouter } from './routes/auth.js';
import { boardsRouter } from './routes/boards.js';
import { boardsDemoRouter } from './routes/boards-demo.js';
import { zonesRouter } from './routes/zones.js';
import { suggestionsRouter } from './routes/suggestions.js';
import { notificationsRouter } from './routes/notifications.js';
import { feedbackRouter } from './routes/feedback.js';
import { invitesRouter } from './routes/invites.js';
import { queueRouter } from './routes/queue.js';
import { usersRouter } from './routes/users.js';
import { prisma } from './db.js';

export function createApp() {
  const app = express();

applySecurity(app);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));


app.use(
  pinoHttp({
    logger,
    customSuccessMessage: (req, res) => `${req.method} ${req.url} -> ${res.statusCode}`,
  }),
);

app.use((req, _res, next) => {
  inc('http_requests_total');
  next();
});


  app.use(helmet());
  // CORS já aplicado em applySecurity; evita duplicar
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'api', time: new Date().toISOString() });
  });

  // Aceitar convite por token (link compartilhado; não exige boardId na URL)
  app.get('/invite/accept', async (req, res) => {
    const t = String(req.query.token ?? '');
    if (!t) return res.status(400).json({ error: 'missing_token' });
    const inv = await prisma.invite.findUnique({ where: { token: t } });
    if (!inv) return res.status(404).json({ error: 'not_found' });
    if (inv.acceptedAt) return res.status(409).json({ error: 'already_accepted' });
    if (inv.expiresAt.getTime() < Date.now()) return res.status(410).json({ error: 'expired' });
    const accepted = await prisma.invite.update({ where: { token: t }, data: { acceptedAt: new Date() } });
    return res.json({ ok: true, invite: accepted, boardId: accepted.boardId });
  });

  app.use('/auth', authRouter);
  app.use('/boards', boardsDemoRouter);
  app.use('/boards', boardsRouter);
  app.use('/boards/:boardId/zones', zonesRouter);
  app.use('/boards/:boardId/suggestions', suggestionsRouter);
  app.use('/notifications', notificationsRouter);
  app.use('/feedback', feedbackRouter);
  app.use('/boards/:boardId/invites', invitesRouter);
  app.use('/zones/:zoneId/queue', queueRouter);
  app.use('/users', usersRouter);

  const spec = loadOpenApiSpec();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

  return app;
}
