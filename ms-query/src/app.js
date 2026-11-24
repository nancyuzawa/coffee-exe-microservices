import express from 'express';
import cors from 'cors';
import { fn, col } from 'sequelize';
import { HttpError, errorHandler } from './errors.js';
import { uuid } from './validation.js';

export function createApp({ database, origins, isInitialized = () => true }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: origins, methods: ['GET', 'OPTIONS'] }));
  app.get('/health', (req, res) => res.json({ service: 'ms-query', status: 'UP' }));
  app.use((req, res, next) => isInitialized() ? next() : next(new HttpError(503, 'Consulta aguardando sincronização inicial.', 'CONSULTA_INDISPONIVEL')));
  app.get('/ready', async (req, res) => {
    await database.sequelize.authenticate();
    res.json({ service: 'ms-query', status: 'READY' });
  });
  for (const [route, model, date] of [['produtos', database.Produto, 'createdAt'], ['pedidos', database.Pedido, 'dataPedido']]) {
    app.get('/' + route, async (req, res) => {
      const rows = (await model.findAll()).map(row => row.data);
      rows.sort((a, b) => route === 'pedidos'
        ? Date.parse(b[date]) - Date.parse(a[date]) || a.id.localeCompare(b.id)
        : Date.parse(a[date]) - Date.parse(b[date]) || a.id.localeCompare(b.id));
      res.json(rows);
    });
    app.get('/' + route + '/:id', async (req, res) => {
      const row = await model.findByPk(uuid(req.params.id));
      if (!row) throw new HttpError(404, 'Registro não encontrado.');
      res.json(row.data);
    });
  }
  app.get('/avaliacoes', async (req, res) => {
    const produtoId = uuid(req.query.produtoId, 'produtoId');
    res.json(await database.Avaliacao.findAll({ where: { produtoId }, order: [['criadoEm', 'DESC'], ['id', 'ASC']] }));
  });
  app.get('/avaliacoes/media/:produtoId', async (req, res) => {
    const produtoId = uuid(req.params.produtoId, 'produtoId');
    const [result] = await database.Avaliacao.findAll({ where: { produtoId }, attributes: [[fn('AVG', col('nota')), 'media'], [fn('COUNT', col('id')), 'total']], raw: true });
    res.json({ produtoId, media: result?.media == null ? null : Math.round(Number(result.media) * 100) / 100, total: Number(result?.total || 0) });
  });
  app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  app.use(errorHandler);
  return app;
}
