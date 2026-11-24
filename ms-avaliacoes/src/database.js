import { Sequelize, DataTypes, Op } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import { HttpError } from './errors.js';

export function createDatabase(options) {
  const sequelize = new Sequelize({ ...options, dialect: 'mysql', logging: false, timezone: '+00:00',
    pool: { max: 5, min: 0, acquire: 4000, idle: 10000 },
    dialectOptions: { connectTimeout: 3000 }, retry: { max: 0 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  });
  const Avaliacao = sequelize.define('Avaliacao', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    produtoId: { type: DataTypes.UUID, allowNull: false },
    nota: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, validate: { min: 1, max: 5 } },
    comentario: { type: DataTypes.STRING(2000), allowNull: false },
    criadoEm: { type: DataTypes.DATE(3), allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: 'avaliacoes', timestamps: false, indexes: [{ fields: ['produtoId', 'criadoEm'] }] });
  const Outbox = sequelize.define('Outbox', {
    id: { type: DataTypes.UUID, primaryKey: true },
    evento: { type: DataTypes.JSON, allowNull: false },
    publicado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { tableName: 'outbox', timestamps: false });

  function eventFor(review) {
    const data = review.toJSON();
    return { id: data.id, type: 'AvaliacaoCriada', data: { ...data, criadoEm: new Date(data.criadoEm).toISOString() } };
  }

  async function saveReview(data) {
    const verify = existing => {
      if (['produtoId', 'nota', 'comentario'].some(key => existing[key] !== data[key])) throw new HttpError(409, 'Identificador já utilizado por outra avaliação.');
      return existing;
    };
    if (data.id) {
      const existing = await Avaliacao.findByPk(data.id);
      if (existing) return verify(existing);
    }
    try {
      return await sequelize.transaction(async transaction => {
        const review = await Avaliacao.create(data, { transaction });
        await Outbox.create({ id: review.id, evento: eventFor(review) }, { transaction });
        return review;
      });
    } catch (error) {
      if (data.id && error.name === 'SequelizeUniqueConstraintError') {
        const existing = await Avaliacao.findByPk(data.id);
        if (existing) return verify(existing);
      }
      throw error;
    }
  }

  async function initialize() {
    await sequelize.authenticate();
    await new Umzug({
      migrations: [
        { name: '001-criar-avaliacoes', up: async () => Avaliacao.sync() },
        { name: '002-outbox-avaliacoes', up: async () => {
          await Outbox.sync();
          // Inclui avaliações anteriores à adoção do barramento, sem apagar dados.
          let lastId;
          while (true) {
            const rows = await Avaliacao.findAll({ ...(lastId ? { where: { id: { [Op.gt]: lastId } } } : {}), order: [['id', 'ASC']], limit: 200 });
            if (!rows.length) break;
            await Outbox.bulkCreate(rows.map(review => ({ id: review.id, evento: eventFor(review) })), { ignoreDuplicates: true });
            lastId = rows.at(-1).id;
          }
        } },
      ],
      storage: new SequelizeStorage({ sequelize }), logger: undefined,
    }).up();
  }
  return { sequelize, Avaliacao, Outbox, saveReview, initialize };
}
