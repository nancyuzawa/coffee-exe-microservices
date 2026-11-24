import { setTimeout as pause } from 'node:timers/promises';
import { config } from './config.js';
import { createDatabase } from './database.js';
import { createApp } from './app.js';
import { createSync } from './sync.js';

const database = createDatabase(config.database);
const sync = createSync({ database, busUrl: config.busUrl });
let syncTimer;
let initialized = false;
const controller = new AbortController();
const app = createApp({
  database,
  origins: config.origins,
  isInitialized: () => initialized && database.isReadable(),
});
const server = app.listen(config.port, '0.0.0.0', () => console.log('ms-query na porta ' + config.port));

async function initialize() {
  while (!controller.signal.aborted) {
    try {
      await database.initialize();
      initialized = true;
      void sync();
      syncTimer = setInterval(sync, 2000);
      console.log('Banco de consulta pronto; recuperando eventos.');
      return;
    } catch (error) {
      console.error('Aguardando banco de consulta:', error.name);
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
  clearInterval(syncTimer);
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
