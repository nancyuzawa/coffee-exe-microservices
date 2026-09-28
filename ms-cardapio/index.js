import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize, { garantirBanco } from "./src/config/database.js";
import Item from "./src/models/Item.js";
import itemRoutes from "./src/routes/itemRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/cardapio", itemRoutes);

app.get("/", (req, res) => {
  res.json({ servico: "ms-cardapio", status: "online" });
});

async function iniciar() {
  try {
    await garantirBanco();
    await sequelize.authenticate();
    console.log(
      `✅ Conectado ao MySQL (ms-cardapio) → banco "${process.env.DB_NAME}" em ${process.env.DB_HOST}:${process.env.DB_PORT}`
    );

    // cria a tabela caso ainda não exista (o schema.sql é a versão "oficial")
    await sequelize.sync();

    const total = await Item.count();
    console.log(`✅ Tabela itens_cardapio pronta (${total} item(ns) cadastrado(s))`);
    if (total === 0) {
      console.log("ℹ️  Cardápio vazio. Cadastre pelo painel admin ou rode: npm run seed");
    }

    app.listen(PORT, () => {
      console.log(`🚀 ms-cardapio rodando em http://localhost:${PORT}`);
    });
  } catch (erro) {
    console.error("❌ Erro ao conectar no banco de dados:", erro);
    process.exit(1);
  }
}

iniciar();
