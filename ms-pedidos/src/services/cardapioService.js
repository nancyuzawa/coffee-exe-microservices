const axios = require("axios");
require("dotenv").config();

const CARDAPIO_URL = process.env.CARDAPIO_SERVICE_URL || "http://localhost:3001";

// Comunicação service-to-service: busca o item no ms-cardapio
// para validar existência, estoque e capturar o snapshot de preço/nome.
async function buscarItemNoCardapio(itemId) {
  try {
    const resposta = await axios.get(`${CARDAPIO_URL}/cardapio/${itemId}`, {
      timeout: 5000,
    });
    return resposta.data;
  } catch (erro) {
    if (erro.response && erro.response.status === 404) {
      return null; // item não existe
    }
    // erro de rede, timeout, serviço fora do ar, etc.
    throw new Error("SERVICO_CARDAPIO_INDISPONIVEL");
  }
}

module.exports = { buscarItemNoCardapio };
