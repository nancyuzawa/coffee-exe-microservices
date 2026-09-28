import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Pedido = sequelize.define(
  "Pedido",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // --- quem fez o pedido (o CPF identifica o cliente; guardado só com dígitos) ---
    nomeCliente: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cpfCliente: {
      type: DataTypes.STRING(11),
      allowNull: false,
    },
    // referência lógica ao item do ms-cardapio (sem FOREIGN KEY: bancos separados)
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // --- snapshot: copiado do cardápio no momento da compra ---
    nomeItem: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    precoUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // ------------------------------------------------------------
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

export default Pedido;
