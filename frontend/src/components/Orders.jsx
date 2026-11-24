import { RefreshCw } from 'lucide-react';
import { date, money } from '../lib/format';
import { Loading, ErrorState, EmptyState } from './ui';

export default function Orders({ orders, loading, error, stale, pendingOrders = [], retry, onRetryPending, onRemovePending }) {
  return (
    <section className="container page">
      <div className="page-heading"><div><h1>Meus pedidos</h1><p>Histórico das compras, com os produtos agrupados por pedido.</p></div><button className="button secondary" onClick={retry} disabled={loading}><RefreshCw size={16} /> Atualizar</button></div>
      {pendingOrders.map(order => <article className="order-card" key={order.requestId}>
        <span className="order-code">Pedido #{order.requestId}</span>
        <div className="pending-order-status"><span className="order-status is-pending">{order.failed ? 'Aguardando revisão' : 'Aguardando processamento'}</span></div>
        <p>{order.message || 'Sua compra foi recebida e será processada quando os serviços estiverem disponíveis.'}</p>
        <ul>{order.itens.map(item => <li key={item.produtoId}>{item.quantidade} × {item.nomeProduto || item.produtoId}</li>)}</ul>
        {order.failed && <><button className="button secondary" onClick={() => onRetryPending(order.requestId)}>Tentar novamente</button><button className="button secondary" onClick={() => onRemovePending(order.requestId)}>Remover da fila</button></>}
      </article>)}
      {error && <ErrorState service="pedidos" />}
      {!error && stale && orders.length > 0 && <p role="status">Exibindo o último histórico salvo. A atualização ocorrerá automaticamente.</p>}
      {loading && !orders.length ? <Loading label="Buscando pedidos…" />
        : error && !orders.length ? null
        : !orders.length ? <EmptyState title="Nenhum pedido realizado." description="Escolha seus produtos no cardápio para começar." />
        : <div className="orders-list">{orders.map(order => (
          <article className="order-card" key={order.id}>
            <span className="order-code">Pedido #{order.id}</span>
            <h2>Compra com {order.itens.length} produto(s)</h2>
            <ul className="purchase-items" aria-label="Produtos da compra">
              {order.itens.map(item => (
                <li className="purchase-item" key={item.produtoId}>
                  <div><h3>{item.nomeProduto}</h3><p>{item.quantidade} unidade(s) × {money(item.precoUnitario)}</p></div>
                  <strong>{money(item.valorTotal)}</strong>
                </li>
              ))}
            </ul>
            <dl className="order-facts">
              <div><dt>Quantidade total</dt><dd>{order.itens.reduce((sum, item) => sum + item.quantidade, 0)} unidade(s)</dd></div>
              <div><dt>Total da compra</dt><dd>{money(order.valorTotal)}</dd></div>
              <div><dt>Data do pedido</dt><dd>{date(order.dataPedido)}</dd></div>
              <div><dt>Status</dt><dd><span className={'order-status ' + (order.status === 'REALIZADO' ? 'is-completed' : 'is-pending')}>{order.status === 'REALIZADO' ? 'Concluído' : order.status === 'CANCELADO' ? 'Cancelado' : order.status}</span></dd></div>
            </dl>
          </article>
        ))}</div>}
    </section>
  );
}
