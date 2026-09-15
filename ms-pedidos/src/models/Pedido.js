const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pedido = sequelize.define(
  "Pedido",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // --- campos de snapshot: copiados do cardápio no momento da compra ---
    nomeItem: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    precoUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // -----------------------------------------------------------------
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valorTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dataPedido: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("REALIZADO", "CANCELADO"),
      allowNull: false,
      defaultValue: "REALIZADO",
    },
  },
  {
    tableName: "pedidos",
    timestamps: true,
  }
);

module.exports = Pedido;
