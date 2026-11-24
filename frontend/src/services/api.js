import axios from 'axios';
import { validQuantity } from '../lib/format';

const queryApi = axios.create({ baseURL: import.meta.env.VITE_QUERY_API_URL || 'http://localhost:3004', timeout: 10000 });
const eventBusApi = axios.create({ baseURL: import.meta.env.VITE_EVENT_BUS_API_URL || 'http://localhost:4005', timeout: 10000 });

export async function getReviews(produtoId) {
  const { data } = await queryApi.get('/avaliacoes', { params: { produtoId } });
  if (!Array.isArray(data)) throw new Error('Lista de avaliações inválida.');
  return data;
}

export async function getReviewAverage(produtoId) {
  const { data } = await queryApi.get('/avaliacoes/media/' + encodeURIComponent(produtoId));
  return data;
}

export async function createReview(produtoId, nota, comentario, requestId) {
  const { data } = await eventBusApi.post('/review-requests', { produtoId, nota, comentario, requestId });
  return data;
}

export async function getReviewRequests(produtoId) {
  const { data } = await eventBusApi.get('/review-requests', { params: { produtoId }, timeout: 3000 });
  if (!Array.isArray(data)) throw new Error('Solicitações de avaliação inválidas.');
  return data;
}

export async function getProducts() {
  const { data } = await queryApi.get('/produtos');
  if (!Array.isArray(data)) throw new Error('O serviço de produtos retornou uma lista inválida.');
  return data;
}

export async function getOrders() {
  const { data } = await queryApi.get('/pedidos');
  if (!Array.isArray(data)) throw new Error('O serviço de pedidos retornou uma lista inválida.');
  return data;
}

export async function createOrder(itens, requestId) {
  if (!Array.isArray(itens) || !itens.length || itens.some(item => !item.produtoId || !validQuantity(item.quantidade))) {
    throw new Error('Selecione os produtos e informe quantidades inteiras maiores que zero.');
  }
  const { data } = await eventBusApi.post('/order-requests', { itens: itens.map(({ produtoId, quantidade }) => ({ produtoId, quantidade })), requestId });
  return data;
}

export function errorMessage(error, service) {
  const detail = error.response?.data?.error;
  if (typeof detail === 'string') return detail;
  if (error.code === 'ECONNABORTED') return 'O serviço de ' + service + ' demorou para responder. Tente novamente.';
  if (error.isAxiosError && !error.response) return 'Não foi possível conectar ao serviço de ' + service + '. Tente novamente.';
  if (error.response?.status >= 500) return 'O serviço de ' + service + ' está temporariamente indisponível.';
  return error.message || 'Não foi possível concluir a operação.';
}
