import './load-env.js';
import http from 'node:http';
import { createApp } from './app';
import { env } from './env';
import { createSocketServer } from './socket';

const app = createApp();
const server = http.createServer(app);
createSocketServer(server);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});
