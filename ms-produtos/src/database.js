import { randomUUID } from 'node:crypto';
import { Sequelize, DataTypes } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

const numeric = field => ({
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  get() { return Number(this.getDataValue(field)); },
});

export function createDatabase(options) {
  const sequelize = new Sequelize({ ...options, dialect: 'mysql', logging: false, timezone: '+00:00',
    pool: { max: 5, min: 0, acquire: 4000, idle: 10000 },
    dialectOptions: { connectTimeout: 3000 },
    retry: { max: 0 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  });
  const Produto = sequelize.define('Produto', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    preco: numeric('preco'),
    descricao: { type: DataTypes.TEXT, allowNull: false },
  }, { tableName: 'produtos', timestamps: true });

  const Outbox = sequelize.define('Outbox', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    evento: { type: DataTypes.JSON, allowNull: false },
    publicado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { tableName: 'outbox', timestamps: false });
  async function recordEvent(type, data, transaction) {
    await Outbox.create({ evento: { id: randomUUID(), type, data: JSON.parse(JSON.stringify(data)) } }, { transaction });
  }

  async function initialize() {
    await sequelize.authenticate();
    const migrations = [{
      name: '001-criar-produtos',
      // Cria o schema sem recriar tabelas existentes.
      up: async () => Produto.sync(),
    }, {
      name: '002-remover-estoque',
      up: async () => {
        const query = sequelize.getQueryInterface();
        const columns = await query.describeTable('produtos');
        if (columns.estoque) await query.removeColumn('produtos', 'estoque');
      },
    }, { name: '003-outbox-consulta', up: async () => {
          await Outbox.sync();
          await sequelize.transaction(async transaction => {
            const rows = await Produto.findAll({ transaction });
            for (const row of rows) await recordEvent('ProdutoAtualizado', row.toJSON(), transaction);
          });
        } }];
    await new Umzug({ migrations, storage: new SequelizeStorage({ sequelize }), logger: undefined }).up();
  }
  return { Outbox, recordEvent, sequelize, Produto, initialize };
}
