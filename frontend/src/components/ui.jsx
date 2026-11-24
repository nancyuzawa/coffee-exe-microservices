import { Minus, Plus, Coffee } from 'lucide-react';
import { maxQuantity } from '../lib/format';

export function Quantity({ value, max = maxQuantity, onChange, disabled = false, label = 'Quantidade' }) {
  return (
    <div className="quantity">
      <button type="button" disabled={disabled || Number(value) <= 1} onClick={() => onChange(Number(value) - 1)} aria-label={'Diminuir ' + label.toLowerCase()}><Minus size={15} /></button>
      <input aria-label={label} type="number" min="1" max={max} step="1" required value={value} disabled={disabled} onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))} />
      <button type="button" disabled={disabled || Number(value) >= max} onClick={() => onChange(Number(value) + 1)} aria-label={'Aumentar ' + label.toLowerCase()}><Plus size={15} /></button>
    </div>
  );
}

export function ErrorState({ service = 'dados' }) {
  return <p className="service-status" role="status"><span aria-hidden="true" />Aguardando conexão com {service}. A atualização será automática.</p>;
}

export function EmptyState({ title, description }) {
  return <div className="empty-state"><Coffee size={40} /><h2>{title}</h2><p>{description}</p></div>;
}

export function Loading({ label = 'Carregando…' }) {
  return <div className="loading" role="status"><span className="spinner" /><span>{label}</span></div>;
}

export function ProductImage({ src, alt, ...props }) {
  return <img src={src || '/assets/hero-banner.png'} alt={alt} onError={event => { if (!event.currentTarget.src.endsWith('/assets/hero-banner.png')) event.currentTarget.src = '/assets/hero-banner.png'; }} {...props} />;
}
