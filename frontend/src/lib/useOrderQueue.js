import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { createOrder } from '../services/api';

const bus = axios.create({ baseURL: import.meta.env.VITE_EVENT_BUS_API_URL || 'http://localhost:4005', timeout: 10000 });
export default function useOrderQueue(onConfirmed) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const { data } = await bus.get('/order-requests');
      setOrders(data.filter(row => row.status !== 'PROCESSADA').map(row => ({
        requestId: row.id, itens: row.itens, failed: row.status === 'REJEITADA', message: row.motivo,
      })));
      setError('');
      void onConfirmed();
    } catch { setError('Não foi possível consultar as compras pendentes no servidor.'); }
  }, [onConfirmed]);
  const enqueue = useCallback(async (itens, requestId) => {
    await createOrder(itens, requestId);
    await refresh();
    return { requestId };
  }, [refresh]);
  const action = useCallback(async (id, action) => {
    try { await bus.post('/order-requests/' + id + '/' + action); await refresh(); }
    catch { setError('Não foi possível atualizar a compra pendente. Tente novamente.'); }
  }, [refresh]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);
  return { orders, error, enqueue, retry: id => action(id, 'retry'), remove: id => action(id, 'remove') };
}
