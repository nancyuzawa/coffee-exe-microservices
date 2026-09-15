const Item = require("../models/Item");

// POST /cardapio
async function criarItem(req, res) {
  try {
    const { nome, preco, descricao, estoque } = req.body;

    if (!nome || preco === undefined) {
      return res.status(400).json({ erro: "Campos 'nome' e 'preco' são obrigatórios." });
    }

    const item = await Item.create({ nome, preco, descricao, estoque });
    return res.status(201).json(item);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao criar item do cardápio." });
  }
}

// GET /cardapio
async function listarItens(req, res) {
  try {
    const itens = await Item.findAll();
    return res.status(200).json(itens);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao listar itens do cardápio." });
  }
}

// GET /cardapio/:id
async function buscarItemPorId(req, res) {
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id);

    if (!item) {
      return res.status(404).json({ erro: "Item não encontrado." });
    }

    return res.status(200).json(item);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao buscar item do cardápio." });
  }
}

module.exports = {
  criarItem,
  listarItens,
  buscarItemPorId,
};
