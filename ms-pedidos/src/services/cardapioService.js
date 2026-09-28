import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const CARDAPIO_URL = process.env.CARDAPIO_SERVICE_URL || "http://localhost:3001";

// Erros "de negócio" que o controller sabe traduzir para HTTP.
const ERRO_INDISPONIVEL = "SERVICO_CARDAPIO_INDISPONIVEL";
const ERRO_ESTOQUE = "ESTOQUE_INSUFICIENTE";

// GET /cardapio/:id  -> devolve o item, ou null se não existir (404).
// Qualquer outra falha (rede, timeout, 5xx) vira SERVICO_CARDAPIO_INDISPONIVEL.
async function buscarItemNoCardapio(itemId) {
  try {
    const resposta = await axios.get(`${CARDAPIO_URL}/cardapio/${itemId}`, {
      timeout: 5000,
    });
    return resposta.data;
  } catch (erro) {
    if (erro.response && erro.response.status === 404) {
      return null;
    }
    throw new Error(ERRO_INDISPONIVEL);
  }
}

// PATCH /cardapio/:id/estoque  { delta }
async function ajustarEstoque(itemId, delta) {
  try {
    const resposta = await axios.patch(
      `${CARDAPIO_URL}/cardapio/${itemId}/estoque`,
      { delta },
      { timeout: 5000 }
    );
    return resposta.data;
  } catch (erro) {
    if (erro.response) {
      if (erro.response.status === 404) return null;
      if (erro.response.status === 409) throw new Error(ERRO_ESTOQUE);
    }
    throw new Error(ERRO_INDISPONIVEL);
  }
}

const baixarEstoque = (itemId, quantidade) => ajustarEstoque(itemId, -quantidade);
const reporEstoque = (itemId, quantidade) => ajustarEstoque(itemId, quantidade);

export {
  buscarItemNoCardapio,
  baixarEstoque,
  reporEstoque,
  ERRO_INDISPONIVEL,
  ERRO_ESTOQUE,
};
