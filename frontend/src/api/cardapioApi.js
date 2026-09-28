import axios from "axios";

const cardapioApi = axios.create({
  baseURL: "http://localhost:3001",
  timeout: 5000,
});

export async function buscarCardapio() {
  const resposta = await cardapioApi.get("/cardapio");
  return resposta.data;
}

// ---------- usados pelo painel admin ----------

export async function criarItem(dados) {
  const resposta = await cardapioApi.post("/cardapio", dados);
  return resposta.data;
}

export async function atualizarItem(id, dados) {
  const resposta = await cardapioApi.put(`/cardapio/${id}`, dados);
  return resposta.data;
}

export async function removerItem(id) {
  await cardapioApi.delete(`/cardapio/${id}`);
}

// delta positivo repõe, negativo baixa
export async function ajustarEstoque(id, delta) {
  const resposta = await cardapioApi.patch(`/cardapio/${id}/estoque`, { delta });
  return resposta.data;
}

export default cardapioApi;
