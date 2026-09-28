import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DataTypes } from "sequelize";
import sequelize, { garantirBanco } from "./src/config/database.js";
import pedidoRoutes from "./src/routes/pedidoRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use("/pedidos", pedidoRoutes);

app.get("/", (req, res) => {
  res.json({ servico: "ms-pedidos", status: "online" });
});

// Se a tabela "pedidos" já existia (criada antes de termos cliente), o sync() não
// adiciona colunas novas. Aqui adicionamos nomeCliente e cpfCliente automaticamente.
async function garantirColunasDoCliente() {
  const qi = sequelize.getQueryInterface();
  const colunas = await qi.describeTable("pedidos");

  if (!colunas.nomeCliente) {
    await qi.addColumn("pedidos", "nomeCliente", { type: DataTypes.STRING, allowNull: true });
    console.log("🛠️  Coluna pedidos.nomeCliente adicionada");
  }
  if (!colunas.cpfCliente) {
    await qi.addColumn("pedidos", "cpfCliente", { type: DataTypes.STRING(11), allowNull: true });
    await qi.addIndex("pedidos", ["cpfCliente"], { name: "idx_pedidos_cpf" });
    console.log("🛠️  Coluna pedidos.cpfCliente adicionada");
  }
}

async function iniciar() {
  try {
    await garantirBanco();
    await sequelize.authenticate();
    console.log(
      `✅ Conectado ao MySQL (ms-pedidos) → banco "${process.env.DB_NAME}" em ${process.env.DB_HOST}:${process.env.DB_PORT}`
    );

    await sequelize.sync();
    await garantirColunasDoCliente();

    const [[{ total }]] = await sequelize.query("SELECT COUNT(*) AS total FROM pedidos");
    console.log(`✅ Tabela pedidos pronta (${total} pedido(s) gravado(s))`);

    app.listen(PORT, () => {
      console.log(`🚀 ms-pedidos rodando em http://localhost:${PORT}`);
    });
  } catch (erro) {
    console.error("❌ Erro ao conectar no banco de dados:", erro);
    process.exit(1);
  }
}

iniciar();
