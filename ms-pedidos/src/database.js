import { randomUUID } from 'node:crypto';
import { Sequelize, DataTypes } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

const decimal = (field, precision) => ({
  type: DataTypes.DECIMAL(precision, 2), allowNull: false,
  get() { return Number(this.getDataValue(field)); },
});

export function createDatabase(options) {
  const sequelize = new Sequelize({ ...options, dialect: 'mysql', logging: false, timezone: '+00:00',
    pool: { max: 5, min: 0, acquire: 4000, idle: 10000 },
    dialectOptions: { connectTimeout: 3000 }, retry: { max: 0 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  });
  const Pedido = sequelize.define('Pedido', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    valorTotal: decimal('valorTotal', 14),
    dataPedido: { type: DataTypes.DATE(3), allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('REALIZADO', 'CANCELADO'), allowNull: false, defaultValue: 'REALIZADO' },
  }, { tableName: 'pedidos', timestamps: false, indexes: [{ fields: ['dataPedido'] }] });
  const ItemPedido = sequelize.define('ItemPedido', {
    // Um código de compra; os itens usam uma chave composta, sem outro UUID.
    pedidoId: { type: DataTypes.UUID, primaryKey: true, allowNull: false,
      references: { model: 'pedidos', key: 'id' }, onDelete: 'CASCADE' },
    produtoId: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    nomeProduto: { type: DataTypes.STRING(150), allowNull: false },
    precoUnitario: decimal('precoUnitario', 10),
    quantidade: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    valorTotal: decimal('valorTotal', 14),
  }, { tableName: 'pedido_itens', timestamps: false });
  Pedido.hasMany(ItemPedido, { as: 'itens', foreignKey: 'pedidoId', onDelete: 'CASCADE' });
  ItemPedido.belongsTo(Pedido, { as: 'pedido', foreignKey: 'pedidoId' });

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
    await new Umzug({
      migrations: [
        { name: '001-criar-pedidos', up: async () => Pedido.sync() },
        { name: '002-agrupar-itens-por-compra', up: async () => {
          await ItemPedido.sync();
          const query = sequelize.getQueryInterface();
          const columns = await query.describeTable('pedidos');
          if (!columns.produtoId) return;
          // Preserva os IDs e snapshots existentes. Pode repetir após interrupção.
          await sequelize.query(`
            INSERT INTO pedido_itens (pedidoId, produtoId, nomeProduto, precoUnitario, quantidade, valorTotal)
            SELECT p.id, p.produtoId, p.nomeProduto, p.precoUnitario, p.quantidade, p.valorTotal
            FROM pedidos p
            WHERE p.produtoId IS NOT NULL AND NOT EXISTS (
              SELECT 1 FROM pedido_itens i WHERE i.pedidoId = p.id AND i.produtoId = p.produtoId
            )
          `);
          // Mantém as colunas antigas, sem apagar dados, mas libera novos cabeçalhos.
          for (const [name, type] of [
            ['produtoId', DataTypes.UUID], ['nomeProduto', DataTypes.STRING(150)],
            ['precoUnitario', DataTypes.DECIMAL(10, 2)], ['quantidade', DataTypes.INTEGER.UNSIGNED],
          ]) await query.changeColumn('pedidos', name, { type, allowNull: true });
        } },
        { name: '003-outbox-consulta', up: async () => {
          await Outbox.sync();
          await sequelize.transaction(async transaction => {
            const rows = await Pedido.findAll({ include: [{ model: ItemPedido, as: 'itens' }], transaction });
            for (const row of rows) await recordEvent('PedidoCriado', row.toJSON(), transaction);
          });
        } },
      ],
      storage: new SequelizeStorage({ sequelize }), logger: undefined,
    }).up();
  }
  return { Outbox, recordEvent, sequelize, Pedido, ItemPedido, initialize };
}
