import axios from "axios";

const cardapioApi = axios.create({
  baseURL: "http://localhost:3001",
  timeout: 5000,
});

export async function buscarCardapio() {
  const resposta = await cardapioApi.get("/cardapio");
  return resposta.data;
}

export default cardapioApi;
