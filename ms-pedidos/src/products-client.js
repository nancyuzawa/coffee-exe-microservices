import axios from 'axios';
import { HttpError } from './errors.js';
import { money, text, uuid } from './validation.js';

export class ProductsClient {
  constructor({ baseURL, timeout = 2000 }) {
    this.http = axios.create({ baseURL, timeout, proxy: false });
  }

  async getProduct(id) {
    try {
      const { data } = await this.http.get('/produtos/' + encodeURIComponent(id));
      if (uuid(data.id) !== id) throw new Error('Produto retornado não corresponde à solicitação.');
      text(data.nome, 'Nome', 150);
      money(data.preco);
      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpError(404, 'Produto não encontrado no catálogo.', 'PRODUTO_NAO_ENCONTRADO');
      }
      throw new HttpError(503, 'Não foi possível validar o produto. O serviço de produtos está indisponível ou demorou a responder.', 'PRODUTOS_INDISPONIVEL');
    }
  }
}
