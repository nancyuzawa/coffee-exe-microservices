import Pedido from "../models/Pedido.js";
import {
  buscarItemNoCardapio,
  baixarEstoque,
  reporEstoque,
  ERRO_INDISPONIVEL,
  ERRO_ESTOQUE,
} from "../services/cardapioService.js";
import { cpfValido, somenteDigitos } from "../utils/cpf.js";

const MSG_INDISPONIVEL =
  "O serviço de cardápio está indisponível no momento. Tente novamente em instantes.";

// POST /pedidos   body: { itemId, quantidade, nomeCliente, cpf }
async function criarPedido(req, res) {
  try {
    const { itemId, quantidade, nomeCliente, cpf } = req.body;

    if (!itemId || !Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({
        erro: "Campos 'itemId' e 'quantidade' (inteiro maior que zero) são obrigatórios.",
      });
    }

    // identificação do cliente (validada antes de mexer no estoque)
    const nome = typeof nomeCliente === "string" ? nomeCliente.trim() : "";
    if (nome.length < 3) {
      return res.status(400).json({
        erro: "O campo 'nomeCliente' é obrigatório (mínimo 3 caracteres).",
      });
    }
    if (!cpfValido(cpf)) {
      return res.status(400).json({ erro: "O campo 'cpf' é obrigatório e deve ser um CPF válido." });
    }
    const cpfCliente = somenteDigitos(cpf);

    // 1) valida se o item existe e captura o snapshot (nome + preço)
    let item;
    try {
      item = await buscarItemNoCardapio(itemId);
    } catch {
      return res.status(503).json({ erro: MSG_INDISPONIVEL });
    }

    if (!item) {
      return res.status(404).json({ erro: "Item não encontrado no cardápio." });
    }

    // 2) verificação rápida de estoque 
    if (item.estoque < quantidade) {
      return res.status(400).json({ erro: "Estoque insuficiente para este item." });
    }

    // 3) baixa o estoque no cardápio. 
    try {
      await baixarEstoque(item.id, quantidade);
    } catch (erro) {
      if (erro.message === ERRO_ESTOQUE) {
        return res.status(400).json({ erro: "Estoque insuficiente para este item." });
      }
      return res.status(503).json({ erro: MSG_INDISPONIVEL });
    }

    // 4) grava o pedido com o snapshot. Se falhar, devolve o estoque
    const precoUnitario = item.preco;
    const valorTotal = Number(precoUnitario) * quantidade;

    try {
      const pedido = await Pedido.create({
        nomeCliente: nome,
        cpfCliente,
        itemId: item.id,
        nomeItem: item.nome,
        precoUnitario,
        quantidade,
        valorTotal,
        status: "REALIZADO",
      });
      return res.status(201).json(pedido);
    } catch (erroBanco) {
      console.error(erroBanco);
      try {
        await reporEstoque(item.id, quantidade);
      } catch (erroCompensacao) {
        console.error("Falha ao repor estoque após erro no pedido:", erroCompensacao);
      }
      return res.status(500).json({ erro: "Erro ao criar pedido." });
    }
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao criar pedido." });
  }
}

// GET /pedidos            -> todos os pedidos (visão do admin)
// GET /pedidos?cpf=...    -> só os pedidos daquele cliente (visão do cliente)
async function listarPedidos(req, res) {
  try {
    const filtro = {};

    if (req.query.cpf !== undefined) {
      if (!cpfValido(req.query.cpf)) {
        return res.status(400).json({ erro: "O parâmetro 'cpf' deve ser um CPF válido." });
      }
      filtro.cpfCliente = somenteDigitos(req.query.cpf);
    }

    const pedidos = await Pedido.findAll({
      where: filtro,
      order: [["dataPedido", "DESC"]],
    });
    return res.status(200).json(pedidos);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao listar pedidos." });
  }
}

// GET /pedidos/:id
async function buscarPedidoPorId(req, res) {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    return res.status(200).json(pedido);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao buscar pedido." });
  }
}

// PATCH /pedidos/:id/cancelar
// Muda o status para CANCELADO e devolve as unidades ao estoque do cardápio.
async function cancelarPedido(req, res) {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    if (pedido.status === "CANCELADO") {
      return res.status(409).json({ erro: "Este pedido já foi cancelado." });
    }

    // repõe primeiro; se o cardápio estiver fora do ar, não cancela pela metade
    try {
      await reporEstoque(pedido.itemId, pedido.quantidade);
    } catch (erro) {
      if (erro.message === ERRO_INDISPONIVEL) {
        return res.status(503).json({ erro: MSG_INDISPONIVEL });
      }
      throw erro;
    }
    // (se o item foi removido do cardápio, reporEstoque devolve null e seguimos com o cancelamento)

    pedido.status = "CANCELADO";
    await pedido.save();

    return res.status(200).json(pedido);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao cancelar pedido." });
  }
}

export { criarPedido, listarPedidos, buscarPedidoPorId, cancelarPedido };
