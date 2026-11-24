export function createConsumer({ busUrl, ordersUrl }) {
  let running = false;
  return async function consume() {
    if (running) return;
    running = true;
    try {
      const response = await fetch(busUrl + '/order-requests?status=PENDENTE', { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('Fila indisponível: ' + response.status);
      for (const request of await response.json()) {
        const result = await fetch(ordersUrl + '/pedidos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: request.id, itens: request.itens }), signal: AbortSignal.timeout(15000),
        });
        if (!result.ok && ![400, 404, 409, 422].includes(result.status)) continue;
        const data = await result.json();
        const ack = await fetch(busUrl + '/order-requests/' + request.id + '/ack', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.ok ? { status: 'PROCESSADA' } : { status: 'REJEITADA', motivo: data.error || 'Compra inválida.' }),
          signal: AbortSignal.timeout(3000),
        });
        if (!ack.ok) throw new Error('Falha ao confirmar processamento.');
      }
    } catch (error) { console.error('Consumo de compras pendente:', error.message); }
    finally { running = false; }
  };
}
