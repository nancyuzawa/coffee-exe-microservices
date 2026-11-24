import express from 'express';
import cors from 'cors';
import { HttpError, errorHandler } from './errors.js';
import { bodyObject, money, text, uuid } from './validation.js';

function productData(value) {
  const body = bodyObject(value);
  return {
    nome: text(body.nome, 'Nome', 150),
    preco: money(body.preco),
    descricao: text(body.descricao, 'Descrição', 5000),
  };
}

export function createApp({ database, origins, isInitialized = () => true }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: origins, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (req, res) => res.json({ service: 'ms-produtos', status: 'UP' }));
  app.get('/ready', async (req, res) => {
    if (!isInitialized()) throw new HttpError(503, 'Banco ainda está sendo inicializado.', 'BANCO_INDISPONIVEL');
    await database.sequelize.authenticate();
    res.json({ service: 'ms-produtos', status: 'READY' });
  });
  app.use('/produtos', (req, res, next) => {
    if (!isInitialized()) return next(new HttpError(503, 'O banco de produtos está inicializando. Tente novamente.', 'BANCO_INDISPONIVEL'));
    next();
  });
  const find = async id => {
    const product = await database.Produto.findByPk(uuid(id));
    if (!product) throw new HttpError(404, 'Produto não encontrado.', 'PRODUTO_NAO_ENCONTRADO');
    return product;
  };
  app.get('/produtos', async (req, res) => res.json(await database.Produto.findAll({ order: [['createdAt', 'ASC'], ['id', 'ASC']] })));
  app.get('/produtos/:id', async (req, res) => res.json(await find(req.params.id)));
  app.post('/produtos', async (req, res) => {
    const product = await database.sequelize.transaction(async transaction => {
      const product = await database.Produto.create(productData(req.body), { transaction });
      await database.recordEvent('ProdutoAtualizado', product.toJSON(), transaction);
      return product;
    });
    res.location('/produtos/' + product.id).status(201).json(product);
  });
  app.put('/produtos/:id', async (req, res) => {
    const values = productData(req.body);
    const product = await database.sequelize.transaction(async transaction => {
      const product = await database.Produto.findByPk(uuid(req.params.id), { transaction, lock: transaction.LOCK.UPDATE });
      if (!product) throw new HttpError(404, 'Produto não encontrado.');
      await product.update(values, { transaction });
      await database.recordEvent('ProdutoAtualizado', product.toJSON(), transaction);
      return product;
    });
    res.json(product);
  });
  app.delete('/produtos/:id', async (req, res) => {
    await database.sequelize.transaction(async transaction => {
      const product = await database.Produto.findByPk(uuid(req.params.id), { transaction, lock: transaction.LOCK.UPDATE });
      if (!product) throw new HttpError(404, 'Produto não encontrado.');
      await product.destroy({ transaction });
      await database.recordEvent('ProdutoExcluido', { id: product.id }, transaction);
    });
    res.status(204).end();
  });
  app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.', code: 'ROTA_NAO_ENCONTRADA' }));
  app.use(errorHandler);
  return app;
}
