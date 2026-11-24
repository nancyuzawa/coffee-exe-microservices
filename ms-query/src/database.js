import { Sequelize, DataTypes } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

export function createDatabase(options) {
  const sequelize = new Sequelize({ ...options, dialect: 'mysql', logging: false, timezone: '+00:00',
    pool: { max: 5, min: 0, acquire: 4000, idle: 10000 }, dialectOptions: { connectTimeout: 3000 }, retry: { max: 0 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  });
  const Avaliacao = sequelize.define('Avaliacao', {
    id: { type: DataTypes.UUID, primaryKey: true },
    produtoId: { type: DataTypes.UUID, allowNull: false },
    nota: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    comentario: { type: DataTypes.STRING(2000), allowNull: false },
    criadoEm: { type: DataTypes.DATE(3), allowNull: false },
  }, { tableName: 'avaliacoes_consulta', timestamps: false, indexes: [{ fields: ['produtoId', 'criadoEm'] }] });
  const Checkpoint = sequelize.define('Checkpoint', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    cursor: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: '0' },
    sincronizado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { tableName: 'checkpoint', timestamps: false });
  const projection = name => sequelize.define(name, {
    id: { type: DataTypes.UUID, primaryKey: true },
    data: { type: DataTypes.JSON, allowNull: false },
  }, { tableName: name.toLowerCase() + '_consulta', timestamps: false });
  const Produto = projection('Produto');
  const Pedido = projection('Pedido');
  let readable = false;
  async function apply(events) {
    await sequelize.transaction(async transaction => {
      const state = await Checkpoint.findByPk(1, { transaction, lock: transaction.LOCK.UPDATE });
      for (const event of events) {
        if (BigInt(event.sequencia) <= BigInt(state.cursor)) continue;
        if (event.type === 'AvaliacaoCriada') {
          await Avaliacao.findOrCreate({ where: { id: event.data.id }, defaults: event.data, transaction });
        } else if (event.type === 'ProdutoAtualizado') {
          await Produto.upsert({ id: event.data.id, data: event.data }, { transaction });
        } else if (event.type === 'ProdutoExcluido') {
          await Produto.destroy({ where: { id: event.data.id }, transaction });
        } else if (event.type === 'PedidoCriado') {
          await Pedido.upsert({ id: event.data.id, data: event.data }, { transaction });
        } else throw new Error('Evento não suportado: ' + event.type);
        await state.update({ cursor: event.sequencia }, { transaction });
      }
    });
  }
  async function markSynchronized() {
    await Checkpoint.update({ sincronizado: true }, { where: { id: 1 } });
    readable = true;
  }
  async function cursor() { return String((await Checkpoint.findByPk(1)).cursor); }
  async function initialize() {
    await sequelize.authenticate();
    await new Umzug({ migrations: [{ name: '001-projecao-avaliacoes', up: async () => {
      await Avaliacao.sync();
      await Checkpoint.sync();
      await Checkpoint.findOrCreate({ where: { id: 1 } });
    } }, { name: '002-projecoes-produtos-pedidos', up: async () => {
      await Produto.sync();
      await Pedido.sync();
      await Checkpoint.update({ cursor: '0', sincronizado: false }, { where: { id: 1 } });
    } }], storage: new SequelizeStorage({ sequelize }), logger: undefined }).up();
    readable = Boolean((await Checkpoint.findByPk(1)).sincronizado);
  }
  return { Produto, Pedido, sequelize, Avaliacao, Checkpoint, apply, cursor, markSynchronized, isReadable: () => readable, initialize };
}
