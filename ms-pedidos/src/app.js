import express from 'express';
import cors from 'cors';
import { HttpError, errorHandler } from './errors.js';
import { bodyObject, integer, money, total, uuid } from './validation.js';

export function createApp({ database, productsClient, origins, isInitialized = () => true }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: origins, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (req, res) => res.json({ service: 'ms-pedidos', status: 'UP' }));
  app.get('/ready', async (req, res) => {
    if (!isInitialized()) throw new HttpError(503, 'Banco ainda está sendo inicializado.', 'BANCO_INDISPONIVEL');
    await database.sequelize.authenticate();
    res.json({ service: 'ms-pedidos', status: 'READY' });
  });
  app.use('/pedidos', (req, res, next) => {
    if (!isInitialized()) return next(new HttpError(503, 'O banco de pedidos está inicializando. Tente novamente.', 'BANCO_INDISPONIVEL'));
    next();
  });
  const include = [{ model: database.ItemPedido, as: 'itens' }];
  app.get('/pedidos', async (req, res) => res.json(await database.Pedido.findAll({ include, order: [['dataPedido', 'DESC'], ['id', 'ASC']] })));
  app.get('/pedidos/:id', async (req, res) => {
    const order = await database.Pedido.findByPk(uuid(req.params.id), { include });
    if (!order) throw new HttpError(404, 'Pedido não encontrado.', 'PEDIDO_NAO_ENCONTRADO');
    res.json(order);
  });
  app.post('/pedidos', async (req, res) => {
    const body = bodyObject(req.body);
    if (!Array.isArray(body.itens) || body.itens.length < 1 || body.itens.length > 100) {
      throw new HttpError(400, 'Informe de 1 a 100 produtos no pedido.', 'ITENS_INVALIDOS');
    }
    const ids = new Set();
    const selection = body.itens.map(value => {
      const item = bodyObject(value);
      const produtoId = uuid(item.produtoId, 'produtoId');
      const quantidade = integer(item.quantidade, 'Quantidade', 1, 1000000);
      if (ids.has(produtoId)) throw new HttpError(400, 'Cada produto deve aparecer uma única vez, com sua quantidade total.', 'PRODUTO_REPETIDO');
      ids.add(produtoId);
      return { produtoId, quantidade };
    });
    // O mesmo identificador pode ser reenviado após timeout ou reinício.
    const requestId = body.requestId === undefined ? undefined : uuid(body.requestId, 'requestId');
    const replay = async () => {
      if (!requestId) return false;
      const existing = await database.Pedido.findByPk(requestId, { include });
      if (!existing) return false;
      if (existing.itens.length !== selection.length || selection.some(item => !existing.itens.some(saved => saved.produtoId === item.produtoId && saved.quantidade === item.quantidade))) {
        throw new HttpError(409, 'Identificador já utilizado por outro pedido.', 'PEDIDO_CONFLITANTE');
      }
      res.location('/pedidos/' + existing.id).status(200).json(existing);
      return true;
    };
    // Recupera a confirmação mesmo se Produtos estiver indisponível agora.
    if (await replay()) return;
    // Nenhum registro é gravado antes de todos os produtos serem validados.
    const itens = await Promise.all(selection.map(async item => {
      const product = await productsClient.getProduct(item.produtoId);
      return { ...item, nomeProduto: product.nome, precoUnitario: money(product.preco), valorTotal: total(product.preco, item.quantidade) };
    }));
    const cents = itens.reduce((sum, item) => sum + BigInt(item.valorTotal.replace('.', '')), 0n);
    if (cents > 99999999999999n) throw new HttpError(400, 'O valor total da compra excede o limite permitido.', 'TOTAL_INVALIDO');
    const valorTotal = (cents / 100n).toString() + '.' + (cents % 100n).toString().padStart(2, '0');
    // Transação única: cabeçalho e itens são salvos juntos, ou tudo é desfeito.
    let order;
    try {
      order = await database.sequelize.transaction(async transaction => {
        const saved = await database.Pedido.create(
          { ...(requestId ? { id: requestId } : {}), valorTotal, status: 'REALIZADO', itens }, { include, transaction });
        await database.recordEvent('PedidoCriado', saved.toJSON(), transaction);
        return saved;
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' && await replay()) return;
      throw error;
    }
    res.location('/pedidos/' + order.id).status(201).json(order);
  });
  app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.', code: 'ROTA_NAO_ENCONTRADA' }));
  app.use(errorHandler);
  return app;
}
