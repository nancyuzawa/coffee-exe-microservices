import { isDeepStrictEqual } from 'node:util';
import { Sequelize, DataTypes, Op } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

export function createDatabase(options) {
  const sequelize = new Sequelize({ ...options, dialect: 'mysql', logging: false, timezone: '+00:00',
    pool: { max: 5, min: 0, acquire: 4000, idle: 10000 }, dialectOptions: { connectTimeout: 3000 }, retry: { max: 0 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  });
  const Evento = sequelize.define('Evento', {
    sequencia: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    id: { type: DataTypes.UUID, allowNull: false, unique: true },
    type: { type: DataTypes.STRING(80), allowNull: false },
    data: { type: DataTypes.JSON, allowNull: false },
  }, { tableName: 'eventos', timestamps: false });
  // Serializa a atribuição das sequências até o commit: evita saltar eventos
  // de transações concorrentes que confirmem fora de ordem.
  const Controle = sequelize.define('Controle', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
  }, { tableName: 'controle', timestamps: false });
  const Solicitacao = sequelize.define('Solicitacao', {
    id: { type: DataTypes.UUID, primaryKey: true },
    produtoId: { type: DataTypes.UUID, allowNull: false },
    nota: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    comentario: { type: DataTypes.STRING(2000), allowNull: false },
    criadoEm: { type: DataTypes.DATE(3), allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('PENDENTE', 'PROCESSADA', 'REJEITADA'), allowNull: false, defaultValue: 'PENDENTE' },
    motivo: { type: DataTypes.STRING(1000), allowNull: true },
  }, { tableName: 'solicitacoes_avaliacao', timestamps: false, indexes: [{ fields: ['status', 'criadoEm'] }, { fields: ['produtoId'] }] });

  const Compra = sequelize.define('Compra', {
    id: { type: DataTypes.UUID, primaryKey: true },
    itens: { type: DataTypes.JSON, allowNull: false },
    criadoEm: { type: DataTypes.DATE(3), allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('PENDENTE', 'PROCESSADA', 'REJEITADA'), allowNull: false, defaultValue: 'PENDENTE' },
    motivo: { type: DataTypes.STRING(1000), allowNull: true },
  }, { tableName: 'solicitacoes_compra', timestamps: false });
  async function enqueueOrder(data) {
    const [stored] = await Compra.findOrCreate({ where: { id: data.id }, defaults: data });
    if (!isDeepStrictEqual(stored.itens, data.itens)) {
      const error = new Error('Identificador já utilizado por outra compra.');
      error.status = 409;
      throw error;
    }
    return stored;
  }
  async function enqueue(data) {
    const [stored] = await Solicitacao.findOrCreate({ where: { id: data.id }, defaults: data });
    if (['produtoId', 'nota', 'comentario'].some(key => stored[key] !== data[key])) {
      const error = new Error('Identificador já utilizado por outra avaliação.');
      error.status = 409;
      throw error;
    }
    return stored;
  }

  async function append(event) {
    return sequelize.transaction(async transaction => {
      await Controle.findByPk(1, { transaction, lock: transaction.LOCK.UPDATE });
      const [stored] = await Evento.findOrCreate({ where: { id: event.id }, defaults: event, transaction });
      if (stored.type !== event.type || !isDeepStrictEqual(stored.data, event.data)) {
        const error = new Error('ID de evento já utilizado com conteúdo diferente.');
        error.status = 409;
        throw error;
      }
      return stored;
    });
  }
  async function list(after, limit) {
    return Evento.findAll({ where: { sequencia: { [Op.gt]: after } }, order: [['sequencia', 'ASC']], limit });
  }
  async function initialize() {
    await sequelize.authenticate();
    await new Umzug({ migrations: [{ name: '001-eventos-persistentes', up: async () => {
      await Controle.sync();
      await Controle.findOrCreate({ where: { id: 1 } });
      await Evento.sync();
    } }, { name: '002-fila-solicitacoes-avaliacao', up: async () => Solicitacao.sync() }, { name: '003-fila-compras', up: async () => Compra.sync() }], storage: new SequelizeStorage({ sequelize }), logger: undefined }).up();
  }
  return { Compra, enqueueOrder, sequelize, Evento, Solicitacao, enqueue, append, list, initialize };
}
