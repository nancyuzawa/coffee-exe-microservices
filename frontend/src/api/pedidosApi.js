import axios from "axios";

const pedidosApi = axios.create({
  baseURL: "http://localhost:3002",
  timeout: 5000,
});

// Sem CPF: todos os pedidos (admin). Com CPF: só os daquele cliente.
export async function buscarPedidos(cpf) {
  const resposta = await pedidosApi.get("/pedidos", { params: cpf ? { cpf } : {} });
  return resposta.data;
}

export async function criarPedido({ itemId, quantidade, nomeCliente, cpf }) {
  const resposta = await pedidosApi.post("/pedidos", { itemId, quantidade, nomeCliente, cpf });
  return resposta.data;
}

export async function cancelarPedido(id) {
  const resposta = await pedidosApi.patch(`/pedidos/${id}/cancelar`);
  return resposta.data;
}

export default pedidosApi;
