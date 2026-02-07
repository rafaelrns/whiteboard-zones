import './load-env.js';
import http from 'node:http';
import { createApp } from './app.js';
import { env } from './env.js';
import { createSocketServer } from './socket.js';

const app = createApp();
const server = http.createServer(app);
createSocketServer(server);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});
