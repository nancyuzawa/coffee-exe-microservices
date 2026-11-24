export function createPublisher({ database, busUrl, timeout = 2000 }) {
  let running = false;
  return async function publish() {
    if (running) return;
    running = true;
    try {
      const pending = await database.Outbox.findAll({ where: { publicado: false }, order: [['id', 'ASC']], limit: 100 });
      for (const item of pending) {
        const response = await fetch(busUrl + '/events', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.evento), signal: AbortSignal.timeout(timeout),
        });
        if (!response.ok) throw new Error('Event Bus retornou ' + response.status);
        // Só confirma após o barramento persistir. Reenvios usam o mesmo ID.
        await item.update({ publicado: true });
      }
    } catch (error) {
      console.error('Publicação pendente na outbox:', error.message);
    } finally { running = false; }
  };
}
