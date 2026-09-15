require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/database");
const Pedido = require("./models/Pedido");

const PORT = process.env.PORT || 3002;

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao MySQL (ms-pedidos)");

    await sequelize.sync();
    console.log("✅ Tabelas sincronizadas (ms-pedidos)");

    app.listen(PORT, () => {
      console.log(`🚀 ms-pedidos rodando em http://localhost:${PORT}`);
    });
  } catch (erro) {
    console.error("❌ Erro ao conectar no banco de dados:", erro);
    process.exit(1);
  }
}

iniciar();
