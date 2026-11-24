export const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
export function date(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Data não informada' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
}
export const maxQuantity = 1000000;
export function validQuantity(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= maxQuantity;
}
