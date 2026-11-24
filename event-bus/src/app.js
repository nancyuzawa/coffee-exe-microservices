import express from 'express';
import cors from 'cors';
import { HttpError, errorHandler } from './errors.js';
import { bodyObject, integer, text, uuid } from './validation.js';

export function createApp({ database, origins, isInitialized = () => true }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: origins, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (req, res) => res.json({ service: 'event-bus', status: 'UP' }));
  app.get('/ready', async (req, res) => {
    if (!isInitialized()) throw new HttpError(503, 'Banco inicializando.');
    await database.sequelize.authenticate();
    res.json({ service: 'event-bus', status: 'READY' });
  });
  app.use('/events', (req, res, next) => isInitialized() ? next() : next(new HttpError(503, 'Banco inicializando.')));
  app.use('/review-requests', (req, res, next) => isInitialized() ? next() : next(new HttpError(503, 'Banco inicializando.')));
  app.use('/order-requests', (req, res, next) => isInitialized() ? next() : next(new HttpError(503, 'Banco inicializando.')));
  app.post('/order-requests', async (req, res) => {
    const body = bodyObject(req.body);
    if (!Array.isArray(body.itens) || !body.itens.length || body.itens.length > 100) throw new HttpError(400, 'Itens inválidos.');
    const ids = new Set();
    const itens = body.itens.map(item => {
      const produtoId = uuid(item.produtoId);
      if (ids.has(produtoId)) throw new HttpError(400, 'Produto repetido.');
      ids.add(produtoId);
      return { produtoId, quantidade: integer(item.quantidade, 'Quantidade', 1, 1000000) };
    });
    res.status(202).json(await database.enqueueOrder({ id: uuid(body.requestId), itens }));
  });
  app.get('/order-requests', async (req, res) => {
    const where = req.query.status === 'PENDENTE' ? { status: 'PENDENTE' } : {};
    res.json(await database.Compra.findAll({ where, order: [['criadoEm', 'ASC'], ['id', 'ASC']] }));
  });
  app.post('/order-requests/:id/ack', async (req, res) => {
    const id = uuid(req.params.id);
    const body = bodyObject(req.body);
    if (!['PROCESSADA', 'REJEITADA'].includes(body.status)) throw new HttpError(400, 'Status inválido.');
    const motivo = body.status === 'REJEITADA' ? text(body.motivo, 'Motivo', 1000) : null;
    const stored = await database.Compra.findByPk(id);
    if (!stored) throw new HttpError(404, 'Compra não encontrada.');
    await database.Compra.update({ status: body.status, motivo }, { where: { id, status: 'PENDENTE' } });
    res.json(await database.Compra.findByPk(id));
  });
  app.post('/order-requests/:id/retry', async (req, res) => {
    const id = uuid(req.params.id);
    await database.Compra.update({ status: 'PENDENTE', motivo: null }, { where: { id, status: 'REJEITADA' } });
    res.json({ id });
  });
  app.post('/order-requests/:id/remove', async (req, res) => {
    await database.Compra.destroy({ where: { id: uuid(req.params.id), status: 'REJEITADA' } });
    res.status(204).end();
  });
  app.post('/review-requests', async (req, res) => {
    const body = bodyObject(req.body);
    const data = { id: uuid(body.requestId, 'requestId'), produtoId: uuid(body.produtoId, 'produtoId'),
      nota: integer(body.nota, 'Nota', 1, 5), comentario: text(body.comentario, 'Comentário', 2000) };
    try { res.status(202).json(await database.enqueue(data)); }
    catch (error) {
      if (error.status === 409) throw new HttpError(409, error.message);
      throw error;
    }
  });
  app.get('/review-requests', async (req, res) => {
    const where = {};
    if (req.query.produtoId !== undefined) where.produtoId = uuid(req.query.produtoId, 'produtoId');
    if (req.query.status !== undefined) {
      if (req.query.status !== 'PENDENTE') throw new HttpError(400, 'Filtro de status inválido.');
      where.status = 'PENDENTE';
    }
    if (!where.produtoId && !where.status) throw new HttpError(400, 'Informe produtoId ou status=PENDENTE.');
    const limit = integer(Number(req.query.limit || 100), 'Limite', 1, 500);
    res.json(await database.Solicitacao.findAll({ where, order: [['criadoEm', where.status ? 'ASC' : 'DESC'], ['id', 'ASC']], limit }));
  });
  app.post('/review-requests/:id/ack', async (req, res) => {
    const id = uuid(req.params.id);
    const body = bodyObject(req.body);
    if (!['PROCESSADA', 'REJEITADA'].includes(body.status)) throw new HttpError(400, 'Status inválido.');
    const motivo = body.status === 'REJEITADA' ? text(body.motivo, 'Motivo', 1000) : null;
    await database.Solicitacao.update({ status: body.status, motivo }, { where: { id, status: 'PENDENTE' } });
    const stored = await database.Solicitacao.findByPk(id);
    if (!stored) throw new HttpError(404, 'Solicitação não encontrada.');
    if (stored.status !== body.status) throw new HttpError(409, 'Solicitação já finalizada com outro status.');
    res.json(stored);
  });
  app.post('/events', async (req, res) => {
    const event = bodyObject(req.body);
    const id = uuid(event.id);
    if (['ProdutoAtualizado', 'ProdutoExcluido', 'PedidoCriado'].includes(event.type)) {
      const data = bodyObject(event.data);
      uuid(data.id);
      if (event.type === 'ProdutoAtualizado') {
        text(data.nome, 'Nome', 150);
        text(data.descricao, 'Descrição', 5000);
        if (!Number.isFinite(data.preco) || data.preco < 0) throw new HttpError(400, 'Preço inválido.');
      }
      if (event.type === 'PedidoCriado') {
        if (!Array.isArray(data.itens) || !data.itens.length || !Number.isFinite(data.valorTotal)) throw new HttpError(400, 'Pedido inválido.');
        for (const item of data.itens) {
          uuid(item.produtoId); integer(item.quantidade, 'Quantidade', 1, 1000000);
          text(item.nomeProduto, 'Nome', 150);
          if (!Number.isFinite(item.precoUnitario) || !Number.isFinite(item.valorTotal)) throw new HttpError(400, 'Valores inválidos.');
        }
        if (!Number.isFinite(Date.parse(data.dataPedido)) || !['REALIZADO', 'CANCELADO'].includes(data.status)) throw new HttpError(400, 'Pedido inválido.');
      }
      const stored = await database.append({ id, type: event.type, data });
      return res.status(201).json({ id: stored.id, sequencia: String(stored.sequencia) });
    }
    if (event.type !== 'AvaliacaoCriada') throw new HttpError(400, 'Tipo de evento inválido.');
    const data = bodyObject(event.data);
    if (uuid(data.id) !== id) throw new HttpError(400, 'ID do evento deve corresponder à avaliação.');
    const criadoEm = new Date(data.criadoEm);
    if (typeof data.criadoEm !== 'string' || !Number.isFinite(criadoEm.getTime())) throw new HttpError(400, 'Data inválida.');
    try {
      const stored = await database.append({ id, type: event.type, data: {
        id, produtoId: uuid(data.produtoId, 'produtoId'), nota: integer(data.nota, 'Nota', 1, 5),
        comentario: text(data.comentario, 'Comentário', 2000), criadoEm: criadoEm.toISOString(),
      } });
      res.status(201).json({ id: stored.id, sequencia: String(stored.sequencia) });
    } catch (error) {
      if (error.status === 409) throw new HttpError(409, error.message);
      throw error;
    }
  });
  app.get('/events', async (req, res) => {
    const after = req.query.after || '0';
    if (typeof after !== 'string' || !/^\d{1,20}$/.test(after)) throw new HttpError(400, 'Cursor inválido.');
    const limit = integer(Number(req.query.limit || 100), 'Limite', 1, 500);
    const events = await database.list(after, limit);
    res.json({ events: events.map(event => ({ sequencia: String(event.sequencia), id: event.id, type: event.type, data: event.data })), next: events.length ? String(events.at(-1).sequencia) : after });
  });
  app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  app.use(errorHandler);
  return app;
}
