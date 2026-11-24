import { HttpError } from './errors.js';

export function uuid(value, label = 'ID') {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, label + ' deve ser um UUID válido.', 'ID_INVALIDO');
  }
  return value.toLowerCase();
}

export function bodyObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Envie um objeto JSON com os campos obrigatórios.', 'DADOS_INVALIDOS');
  }
  return value;
}

export function integer(value, label, min = 0, max = 2147483647) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new HttpError(400, label + ' deve ser um inteiro entre ' + min + ' e ' + max + '.', 'QUANTIDADE_INVALIDA');
  }
  return value;
}

export function text(value, label, max, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.trim().length > max) {
    throw new HttpError(400, label + ' é obrigatório e deve ter no máximo ' + max + ' caracteres.', 'DADOS_INVALIDOS');
  }
  return value.trim();
}

export function money(value) {
  if (!['string', 'number'].includes(typeof value) || !/^\d{1,8}(\.\d{1,2})?$/.test(String(value))) {
    throw new HttpError(400, 'Preço deve ser positivo ou zero, com até duas casas decimais e no máximo 99999999.99.', 'PRECO_INVALIDO');
  }
  const [whole, fraction = ''] = String(value).split('.');
  return whole + '.' + fraction.padEnd(2, '0');
}

export function total(price, quantity) {
  const cents = BigInt(money(price).replace('.', '')) * BigInt(quantity);
  if (cents > 99999999999999n) throw new HttpError(400, 'O valor total excede o limite permitido.', 'TOTAL_INVALIDO');
  return (cents / 100n).toString() + '.' + (cents % 100n).toString().padStart(2, '0');
}
