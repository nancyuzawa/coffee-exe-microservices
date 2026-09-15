const Pedido = require("../models/Pedido");
const { buscarItemNoCardapio } = require("../services/cardapioService");

// POST /pedidos
async function criarPedido(req, res) {
  try {
    const { itemId, quantidade } = req.body;

    if (!itemId || !quantidade || quantidade <= 0) {
      return res
        .status(400)
        .json({ erro: "Campos 'itemId' e 'quantidade' (> 0) são obrigatórios." });
    }

    let item;
    try {
      item = await buscarItemNoCardapio(itemId);
    } catch (erroServico) {
      // serviço de cardápio fora do ar
      return res.status(503).json({
        erro: "O serviço de cardápio está indisponível no momento. Tente novamente em instantes.",
      });
    }

    if (!item) {
      return res.status(404).json({ erro: "Item não encontrado no cardápio." });
    }

    if (item.estoque < quantidade) {
      return res.status(400).json({ erro: "Estoque insuficiente para este item." });
    }

    const precoUnitario = item.preco;
    const valorTotal = Number(precoUnitario) * Number(quantidade);

    const pedido = await Pedido.create({
      itemId: item.id,
      nomeItem: item.nome, // snapshot
      precoUnitario, // snapshot
      quantidade,
      valorTotal,
      status: "REALIZADO",
    });

    return res.status(201).json(pedido);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao criar pedido." });
  }
}

// GET /pedidos
async function listarPedidos(req, res) {
  try {
    const pedidos = await Pedido.findAll({ order: [["dataPedido", "DESC"]] });
    return res.status(200).json(pedidos);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao listar pedidos." });
  }
}

// GET /pedidos/:id
async function buscarPedidoPorId(req, res) {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findByPk(id);

    if (!pedido) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    return res.status(200).json(pedido);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao buscar pedido." });
  }
}

module.exports = {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
};
