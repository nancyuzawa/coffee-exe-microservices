import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/api';

export default function usePersistentList(key, fetchList, service, validate) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stale, setStale] = useState(true);
  const pending = useRef(false);

  const refresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    try {
      const next = await fetchList();
      if (!Array.isArray(next) || !next.every(validate)) throw new Error('Dados recebidos em formato inválido.');
      setData(next);
      setError('');
      setStale(false);
    } catch (failure) {
      setError(errorMessage(failure, service));
      setStale(true);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }, [key, fetchList, service, validate]);

  useEffect(() => {
    const timer = setInterval(refresh, 5000);
    window.addEventListener('online', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', refresh);
    };
  }, [refresh, error]);

  return { data, loading, error, stale, refresh };
}
