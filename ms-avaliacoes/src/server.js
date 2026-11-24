import { setTimeout as pause } from 'node:timers/promises';
import { config } from './config.js';
import { createDatabase } from './database.js';
import { createApp } from './app.js';
import { ProductsClient } from './products-client.js';
import { createPublisher } from './publisher.js';
import { createConsumer } from './consumer.js';

const database = createDatabase(config.database);
const publish = createPublisher({ database, busUrl: config.busUrl });
const productsClient = new ProductsClient({ baseURL: config.productsUrl, timeout: config.productsTimeout });
const consume = createConsumer({ database, productsClient, busUrl: config.busUrl });
let publisherTimer;
let consumerTimer;
let initialized = false;
const controller = new AbortController();
const app = createApp({
  database,
  origins: config.origins,
  isInitialized: () => initialized,
  productsClient,
});
const server = app.listen(config.port, '0.0.0.0', () => console.log('ms-avaliacoes na porta ' + config.port));

async function initialize() {
  while (!controller.signal.aborted) {
    try {
      await database.initialize();
      initialized = true;
      void publish();
      publisherTimer = setInterval(publish, 2000);
      void consume();
      consumerTimer = setInterval(consume, 2000);
      console.log('Banco de avaliações pronto; migrations aplicadas.');
      return;
    } catch (error) {
      console.error('Aguardando banco de avaliações:', error.name);
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
  clearInterval(publisherTimer);
  clearInterval(consumerTimer);
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
