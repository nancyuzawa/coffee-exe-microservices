import { useCallback, useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { createReview, getReviews, getReviewAverage, getReviewRequests } from '../services/api';
import { date } from '../lib/format';
import { requestId } from '../lib/requestId';

function Stars({ value }) {
  return <span className="review-stars" aria-label={value + ' de 5 estrelas'}>{[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} aria-hidden="true" fill={star <= Math.round(value) ? 'currentColor' : 'none'} />)}</span>;
}

export default function Reviews({ product }) {
  const [snapshot, setSnapshot] = useState(null);
  const average = snapshot?.average;
  const reviews = snapshot?.reviews || [];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [requests, setRequests] = useState([]);
  const [requestsUnavailable, setRequestsUnavailable] = useState(false);
  const queued = requests.filter(request => !reviews.some(review => review.id === request.id));
  const pending = useRef(false);
  const refreshing = useRef(false);
  const revision = useRef(0);
  const draftRequest = useRef(null);
  const lastSubmitted = useRef(null);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const saveSnapshot = useCallback(next => {
    if (mounted.current) setSnapshot(next);
  }, []);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    const version = revision.current;
    setLoading(true);
    try {
      const [list, summary, commands] = await Promise.all([getReviews(product.id), getReviewAverage(product.id), getReviewRequests(product.id).catch(() => null)]);
      if (version !== revision.current) return;
      saveSnapshot({ reviews: list, average: summary });
      if (mounted.current) {
        setRequestsUnavailable(commands === null);
        if (commands) setRequests(commands);
      }
      if (mounted.current && list.some(review => review.id === lastSubmitted.current)) {
        setNotice('Avaliação publicada. Obrigado por compartilhar!');
        lastSubmitted.current = null;
      }
      const rejected = commands?.find(request => request.id === lastSubmitted.current && request.status === 'REJEITADA');
      if (mounted.current && rejected) {
        setNotice('Avaliação não publicada: ' + rejected.motivo);
        lastSubmitted.current = null;
      }
      if (mounted.current) setUnavailable(false);
    } catch { if (mounted.current) setUnavailable(true); }
    finally { refreshing.current = false; if (mounted.current) setLoading(false); }
  }, [product.id, saveSnapshot]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(refresh, unavailable || requestsUnavailable || queued.length ? 5000 : 30000);
    window.addEventListener('online', refresh);
    return () => { clearInterval(timer); window.removeEventListener('online', refresh); };
  }, [refresh, unavailable, requestsUnavailable, queued.length]);

  async function submit(event) {
    event.preventDefault();
    if (pending.current || !comment.trim()) return;
    pending.current = true;
    setSending(true);
    setNotice('');
    try {
      const body = { produtoId: product.id, nota: rating, comentario: comment.trim() };
      if (!draftRequest.current || JSON.stringify(draftRequest.current.body) !== JSON.stringify(body)) {
        draftRequest.current = { id: requestId(), body };
      }
      const created = await createReview(product.id, rating, comment.trim(), draftRequest.current.id);
      revision.current++;
      setRequests(current => [created, ...current.filter(request => request.id !== created.id)]);
      lastSubmitted.current = created.id;
      draftRequest.current = null;
      setComment('');
      setNotice('Avaliação recebida no servidor. Será publicada automaticamente após o processamento.');
      await refresh();
    } catch (error) {
      setNotice(error.response?.status < 500 ? error.response?.data?.error : 'Aguardando conexão para enviar sua avaliação. Seu comentário foi mantido.');
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  return <section className="product-reviews" aria-label={'Avaliações de ' + product.nome}>
    <button className="reviews-toggle" type="button" aria-expanded={open} aria-controls={'reviews-' + product.id} onClick={() => setOpen(!open)}>
      <Stars value={average?.media || 0} />
      <span>{average?.total ? `${Number(average.media).toLocaleString('pt-BR')} (${average.total})` : 'Avaliações'}</span>
      <span>{open ? 'Fechar' : 'Ver e avaliar'}</span>
    </button>
    {unavailable && <p className="review-notice" role="status">Aguardando conexão com a consulta de avaliações. A atualização será automática.</p>}
    {!unavailable && requestsUnavailable && <p className="review-notice" role="status">Aguardando conexão para atualizar as avaliações pendentes.</p>}
    <div id={'reviews-' + product.id} hidden={!open}>
      {loading && <p role="status">Atualizando avaliações…</p>}
      {snapshot && !loading && !unavailable && !requestsUnavailable && !reviews.length && !queued.length && <p>Seja o primeiro a avaliar este produto.</p>}
      <ul className="review-list">{queued.map(request => <li key={request.id}>
        <Stars value={request.nota} /><time dateTime={request.criadoEm}>{date(request.criadoEm)}</time>
        <p>{request.comentario}</p>
        <span className="order-status is-pending">{request.status === 'REJEITADA' ? 'Não publicada' : request.status === 'PROCESSADA' ? 'Sincronizando' : 'Aguardando processamento'}</span>
        {request.status === 'REJEITADA' && <p>{request.motivo}</p>}
      </li>)}</ul>
      <ul className="review-list">{reviews.map(review => <li key={review.id}>
        <Stars value={review.nota} /><time dateTime={review.criadoEm}>{date(review.criadoEm)}</time>
        <p>{review.comentario}</p>
      </li>)}</ul>
      <form className="review-form" onSubmit={submit}>
        <fieldset disabled={sending}><legend>Sua nota para {product.nome}</legend>
          <div className="rating-options">{[1, 2, 3, 4, 5].map(value => <label key={value}>
            <input type="radio" name={'rating-' + product.id} value={value} checked={rating === value} onChange={() => setRating(value)} />
            <Star size={22} aria-hidden="true" fill={value <= rating ? 'currentColor' : 'none'} /><span className="sr-only">{value} estrela(s)</span>
          </label>)}</div>
        </fieldset>
        <label htmlFor={'comment-' + product.id}>Seu comentário</label>
        <textarea id={'comment-' + product.id} maxLength={2000} required value={comment} onChange={event => setComment(event.target.value)} disabled={sending} rows={3} />
        <button className="button secondary" disabled={sending || !comment.trim()}>{sending ? 'Enviando…' : 'Enviar avaliação'}</button>
        {notice && <p className="review-notice" role="status">{notice}</p>}
      </form>
    </div>
  </section>;
}
