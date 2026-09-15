require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/database");
const Item = require("./models/Item");

const PORT = process.env.PORT || 3001;

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao MySQL (ms-cardapio)");

    // cria a tabela automaticamente caso não exista
    await sequelize.sync();
    console.log("✅ Tabelas sincronizadas (ms-cardapio)");

    app.listen(PORT, () => {
      console.log(`🚀 ms-cardapio rodando em http://localhost:${PORT}`);
    });
  } catch (erro) {
    console.error("❌ Erro ao conectar no banco de dados:", erro);
    process.exit(1);
  }
}

iniciar();
