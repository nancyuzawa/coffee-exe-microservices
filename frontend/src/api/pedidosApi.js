import axios from "axios";

const pedidosApi = axios.create({
  baseURL: "http://localhost:3002",
  timeout: 5000,
});

export async function buscarPedidos() {
  const resposta = await pedidosApi.get("/pedidos");
  return resposta.data;
}

export async function criarPedido(itemId, quantidade) {
  const resposta = await pedidosApi.post("/pedidos", { itemId, quantidade });
  return resposta.data;
}

export default pedidosApi;
