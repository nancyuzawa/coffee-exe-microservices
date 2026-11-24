import { setTimeout as pause } from 'node:timers/promises';
import { createConsumer } from './consumer.js';
import { createPublisher } from './publisher.js';
import { config } from './config.js';
import { createDatabase } from './database.js';
import { createApp } from './app.js';
import { ProductsClient } from './products-client.js';

const database = createDatabase(config.database);
const publish = createPublisher({ database, busUrl: process.env.EVENT_BUS_URL || 'http://localhost:4005' });
const consume = createConsumer({ busUrl: process.env.EVENT_BUS_URL || 'http://localhost:4005', ordersUrl: 'http://127.0.0.1:' + config.port });
let consumeTimer;
let publishTimer;
let initialized = false;
const controller = new AbortController();
const app = createApp({
  database,
  origins: config.origins,
  isInitialized: () => initialized,
  productsClient: new ProductsClient({ baseURL: config.productsUrl, timeout: config.productsTimeout }),
});
const server = app.listen(config.port, '0.0.0.0', () => console.log('ms-pedidos na porta ' + config.port));

async function initialize() {
  while (!controller.signal.aborted) {
    try {
      await database.initialize();
      initialized = true;
      void consume();
      consumeTimer = setInterval(consume, 2000);
      void publish();
      publishTimer = setInterval(publish, 2000);
      console.log('Banco de pedidos pronto; migrations aplicadas.');
      return;
    } catch (error) {
      console.error('Aguardando banco de pedidos:', error.name);
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
  clearInterval(consumeTimer);
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
