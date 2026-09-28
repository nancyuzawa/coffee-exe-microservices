import sequelize, { garantirBanco } from "./config/database.js";
import Item from "./models/Item.js";

const ITENS = [
  { nome: "Espresso", preco: 6.5, descricao: 'Dose curta e intensa, o "hello world" do café.', estoque: 50 },
  { nome: "Cappuccino", preco: 12.5, descricao: "Espresso com leite vaporizado e espuma cremosa.", estoque: 30 },
  { nome: "Latte", preco: 13.0, descricao: "Suave: muito leite, pouco café.", estoque: 30 },
  { nome: "Cold Brew", preco: 14.0, descricao: "Extração a frio por 18h. Sem bugs de amargor.", estoque: 20 },
  { nome: "Pão de Queijo", preco: 7.0, descricao: "Quentinho, direto do forno (versão estável).", estoque: 40 },
];

async function rodar() {
  try {
    await garantirBanco();
    await sequelize.authenticate();
    await sequelize.sync();

    const existentes = await Item.count();
    if (existentes > 0 && !process.argv.includes("--force")) {
      console.log(`ℹ️  A tabela já tem ${existentes} item(ns). Nada foi inserido (use --force para inserir mesmo assim).`);
    } else {
      await Item.bulkCreate(ITENS);
      console.log(`✅ ${ITENS.length} itens inseridos em "${process.env.DB_NAME}".`);
    }
    await sequelize.close();
  } catch (erro) {
    console.error("❌ Erro ao popular o cardápio:", erro);
    process.exit(1);
  }
}

rodar();
