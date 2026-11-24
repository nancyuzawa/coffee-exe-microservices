export function createSync({ database, busUrl, timeout = 3000 }) {
  let running = false;
  return async function sync() {
    if (running) return;
    running = true;
    try {
      // Limita cada rodada para permitir encerramento e novas tentativas.
      for (let page = 0; page < 100; page++) {
        const after = await database.cursor();
        const response = await fetch(busUrl + '/events?after=' + after + '&limit=100', { signal: AbortSignal.timeout(timeout) });
        if (!response.ok) throw new Error('Event Bus retornou ' + response.status);
        const batch = await response.json();
        if (!Array.isArray(batch.events)) throw new Error('Histórico de eventos inválido.');
        let previous = BigInt(after);
        for (const event of batch.events) {
          if (!/^\d+$/.test(event.sequencia) || BigInt(event.sequencia) <= previous) throw new Error('Sequência de eventos inválida.');
          previous = BigInt(event.sequencia);
        }
        if (batch.events.length) await database.apply(batch.events);
        if (batch.events.length < 100) {
          await database.markSynchronized();
          return;
        }
      }
    } catch (error) {
      console.error('Sincronização pendente:', error.message);
    } finally { running = false; }
  };
}
