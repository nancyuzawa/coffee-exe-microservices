import { setTimeout as pause } from 'node:timers/promises';
import { createPublisher } from './publisher.js';
import { config } from './config.js';
import { createDatabase } from './database.js';
import { createApp } from './app.js';


const database = createDatabase(config.database);
const publish = createPublisher({ database, busUrl: process.env.EVENT_BUS_URL || 'http://localhost:4005' });
let publishTimer;
let initialized = false;
const controller = new AbortController();
const app = createApp({
  database,
  origins: config.origins,
  isInitialized: () => initialized,
  
});
const server = app.listen(config.port, '0.0.0.0', () => console.log('ms-produtos na porta ' + config.port));

async function initialize() {
  while (!controller.signal.aborted) {
    try {
      await database.initialize();
      initialized = true;
      void publish();
      publishTimer = setInterval(publish, 2000);
      console.log('Banco de produtos pronto; migrations aplicadas.');
      return;
    } catch (error) {
      console.error('Aguardando banco de produtos:', error.name);
      try { await pause(3000, undefined, { signal: controller.signal }); } catch { return; }
    }
  }
}
void initialize();

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  controller.abort();
  clearInterval(publishTimer);
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.close(async () => {
    await database.sequelize.close();
    clearTimeout(timeout);
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
