import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const api = async (port, path, method = 'GET', body) => {
  const response = await fetch(`http://localhost:${port}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  assert.ok(response.ok, `${method} ${path}: ${response.status} ${text}`);
  return data;
};
const waitFor = async (fn) => {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (await fn()) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Tempo esgotado aguardando sincronização');
};
const compose = (...args) => execFileSync('docker', ['compose', ...args], { stdio: 'pipe' });
let product;
try {
  const originals = await api(3001, '/produtos');
  await waitFor(async () => (await api(3004, '/produtos')).length === originals.length);
  product = await api(3001, '/produtos', 'POST', { nome: 'Teste sincronizacao Query', preco: 12.5, descricao: 'Produto temporario de verificacao' });
  await waitFor(async () => (await api(3004, '/produtos')).some(p => p.id === product.id));
  const requestId = crypto.randomUUID();
  const body = { requestId, itens: [{ produtoId: product.id, quantidade: 2 }] };
  compose('stop', 'ms-pedidos', 'ms-produtos');
  assert.ok((await api(3004, '/produtos')).some(p => p.id === product.id));
  await api(3004, '/pedidos');
  await api(4005, '/order-requests', 'POST', body);
  await api(4005, '/order-requests', 'POST', body);
  compose('restart', 'event-bus');
  await waitFor(async () => { try { return (await api(4005, '/order-requests')).some(p => p.id === requestId); } catch { return false; } });
  compose('start', 'ms-pedidos', 'ms-produtos');
  await waitFor(async () => (await api(3004, '/pedidos')).some(p => p.id === requestId));
  const confirmed = (await api(3004, '/pedidos')).filter(p => p.id === requestId);
  assert.equal(confirmed.length, 1);
  assert.equal(confirmed[0].valorTotal, 25);
  await api(3001, '/produtos/' + product.id, 'PUT', { nome: 'Teste sincronizacao atualizado', preco: 15, descricao: 'Produto temporario de verificacao' });
  await waitFor(async () => (await api(3004, '/produtos')).find(p => p.id === product.id)?.preco === 15);
  assert.equal((await api(3004, '/pedidos')).find(p => p.id === requestId).itens[0].precoUnitario, 12.5);
  await api(3001, '/produtos/' + product.id, 'DELETE');
  await waitFor(async () => !(await api(3004, '/produtos')).some(p => p.id === product.id));
  product = null;
  compose('restart', 'ms-query');
  await waitFor(async () => { try { return (await api(3004, '/pedidos')).some(p => p.id === requestId); } catch { return false; } });
  console.log('PASS: backfill, CRUD projetado, leituras durante queda, fila persistente após reinício, reenvio sem duplicação, snapshot e persistência do Query.');
  console.log('Pedido de teste preservado no histórico:', requestId);
} finally {
  compose('start', 'ms-produtos', 'ms-pedidos', 'event-bus', 'ms-query');
  if (product) await api(3001, '/produtos/' + product.id, 'DELETE').catch(() => {});
}
