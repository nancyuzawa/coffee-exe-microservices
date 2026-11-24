export function createConsumer({ database, productsClient, busUrl, timeout = 3000 }) {
  let running = false;
  async function acknowledge(id, status, motivo) {
    const response = await fetch(busUrl + '/review-requests/' + id + '/ack', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, motivo }), signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) throw new Error('Confirmação da solicitação falhou: ' + response.status);
  }
  return async function consume() {
    if (running) return;
    running = true;
    try {
      const response = await fetch(busUrl + '/review-requests?status=PENDENTE&limit=100', { signal: AbortSignal.timeout(timeout) });
      if (!response.ok) throw new Error('Consulta de solicitações falhou: ' + response.status);
      const requests = await response.json();
      if (!Array.isArray(requests)) throw new Error('Fila de avaliações inválida.');
      for (const request of requests) {
        try {
          // Após uma perda de ACK, não depende novamente de Produtos para confirmar.
          const existing = await database.Avaliacao.findByPk(request.id);
          if (!existing) await productsClient.getProduct(request.produtoId);
          await database.saveReview({ id: request.id, produtoId: request.produtoId, nota: request.nota, comentario: request.comentario, criadoEm: request.criadoEm });
        } catch (error) {
          if ([400, 404, 409, 422].includes(error.status)) {
            await acknowledge(request.id, 'REJEITADA', error.message);
            continue;
          }
          throw error;
        }
        await acknowledge(request.id, 'PROCESSADA');
      }
    } catch (error) {
      console.error('Consumo de avaliações pendente:', error.message);
    } finally { running = false; }
  };
}
