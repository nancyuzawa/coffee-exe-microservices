import express from 'express';
import cors from 'cors';
import { fn, col } from 'sequelize';
import { HttpError, errorHandler } from './errors.js';
import { bodyObject, integer, text, uuid } from './validation.js';

export function createApp({ database, productsClient, origins, isInitialized = () => true }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: origins, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (req, res) => res.json({ service: 'ms-avaliacoes', status: 'UP' }));
  app.get('/ready', async (req, res) => {
    if (!isInitialized()) throw new HttpError(503, 'Banco ainda está sendo inicializado.', 'BANCO_INDISPONIVEL');
    await database.sequelize.authenticate();
    res.json({ service: 'ms-avaliacoes', status: 'READY' });
  });
  app.use('/avaliacoes', (req, res, next) => {
    if (!isInitialized()) return next(new HttpError(503, 'O banco de avaliações está inicializando.', 'BANCO_INDISPONIVEL'));
    next();
  });
  app.get('/avaliacoes', async (req, res) => {
    const produtoId = uuid(req.query.produtoId, 'produtoId');
    res.json(await database.Avaliacao.findAll({ where: { produtoId }, order: [['criadoEm', 'DESC'], ['id', 'ASC']] }));
  });
  app.get('/avaliacoes/media/:produtoId', async (req, res) => {
    const produtoId = uuid(req.params.produtoId, 'produtoId');
    const [result] = await database.Avaliacao.findAll({
      where: { produtoId }, attributes: [[fn('AVG', col('nota')), 'media'], [fn('COUNT', col('id')), 'total']], raw: true,
    });
    res.json({ produtoId, media: result?.media == null ? null : Math.round(Number(result.media) * 100) / 100, total: Number(result?.total || 0) });
  });
  app.post('/avaliacoes', async (req, res) => {
    const body = bodyObject(req.body);
    const produtoId = uuid(body.produtoId, 'produtoId');
    const nota = integer(body.nota, 'Nota', 1, 5);
    const comentario = text(body.comentario, 'Comentário', 2000);
    await productsClient.getProduct(produtoId);
    const avaliacao = await database.saveReview({ produtoId, nota, comentario });
    res.status(201).json(avaliacao);
  });
  app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.', code: 'ROTA_NAO_ENCONTRADA' }));
  app.use(errorHandler);
  return app;
}
