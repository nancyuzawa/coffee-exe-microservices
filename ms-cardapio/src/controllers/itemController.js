import sequelize from "../config/database.js";
import Item from "../models/Item.js";

// ---------- validação ----------
// Devolve uma mensagem de erro (string) ou null se estiver tudo certo.
function validarItem({ nome, preco, estoque }, { parcial = false } = {}) {
  if (!parcial || nome !== undefined) {
    if (typeof nome !== "string" || nome.trim() === "") {
      return "O campo 'nome' é obrigatório.";
    }
  }
  if (!parcial || preco !== undefined) {
    if (preco === undefined || preco === null || isNaN(Number(preco)) || Number(preco) < 0) {
      return "O campo 'preco' é obrigatório e deve ser um número maior ou igual a zero.";
    }
  }
  if (estoque !== undefined) {
    if (!Number.isInteger(Number(estoque)) || Number(estoque) < 0) {
      return "O campo 'estoque' deve ser um inteiro maior ou igual a zero.";
    }
  }
  return null;
}

// POST /cardapio
async function criarItem(req, res) {
  try {
    const { nome, preco, descricao, estoque } = req.body;

    const erroValidacao = validarItem({ nome, preco, estoque });
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    const item = await Item.create({ nome: nome.trim(), preco, descricao, estoque });
    return res.status(201).json(item);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao criar item do cardápio." });
  }
}

// GET /cardapio
async function listarItens(req, res) {
  try {
    const itens = await Item.findAll({ order: [["nome", "ASC"]] });
    return res.status(200).json(itens);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao listar itens do cardápio." });
  }
}

// GET /cardapio/:id
async function buscarItemPorId(req, res) {
  try {
    const item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ erro: "Item não encontrado." });
    }

    return res.status(200).json(item);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao buscar item do cardápio." });
  }
}

// PUT /cardapio/:id  (atualiza os dados do item)
async function atualizarItem(req, res) {
  try {
    const { nome, preco, descricao, estoque } = req.body;

    const erroValidacao = validarItem({ nome, preco, estoque }, { parcial: true });
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ erro: "Item não encontrado." });
    }

    // só altera o que foi enviado
    if (nome !== undefined) item.nome = nome.trim();
    if (preco !== undefined) item.preco = preco;
    if (descricao !== undefined) item.descricao = descricao;
    if (estoque !== undefined) item.estoque = estoque;

    await item.save();
    return res.status(200).json(item);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao atualizar item do cardápio." });
  }
}

// DELETE /cardapio/:id
async function removerItem(req, res) {
  try {
    const item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ erro: "Item não encontrado." });
    }

    await item.destroy();
    return res.status(204).send();
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao remover item do cardápio." });
  }
}

// PATCH /cardapio/:id/estoque   body: { "delta": -2 }  ou  { "delta": 5 }
// Usado pelo ms-pedidos: baixa o estoque ao criar pedido e repõe ao cancelar.
async function ajustarEstoque(req, res) {
  const { delta } = req.body;

  if (!Number.isInteger(delta) || delta === 0) {
    return res.status(400).json({ erro: "O campo 'delta' deve ser um inteiro diferente de zero." });
  }

  try {
    const item = await sequelize.transaction(async (t) => {
      const encontrado = await Item.findByPk(req.params.id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!encontrado) return null;

      if (encontrado.estoque + delta < 0) {
        throw new Error("ESTOQUE_INSUFICIENTE");
      }

      encontrado.estoque = encontrado.estoque + delta;
      await encontrado.save({ transaction: t });
      return encontrado;
    });

    if (!item) {
      return res.status(404).json({ erro: "Item não encontrado." });
    }

    return res.status(200).json(item);
  } catch (erro) {
    if (erro.message === "ESTOQUE_INSUFICIENTE") {
      return res.status(409).json({ erro: "Estoque insuficiente para este ajuste." });
    }
    console.error(erro);
    return res.status(500).json({ erro: "Erro ao ajustar estoque." });
  }
}

export {
  criarItem,
  listarItens,
  buscarItemPorId,
  atualizarItem,
  removerItem,
  ajustarEstoque,
};
