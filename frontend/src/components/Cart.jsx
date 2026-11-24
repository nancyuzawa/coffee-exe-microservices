import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, Loading, ProductImage, Quantity } from './ui';
import { money, validQuantity } from '../lib/format';
import images from '../data/images.json';

export default function Cart({ cart, products, loading, error, stale, retry, submitting, onQuantity, onRemove, onCheckout }) {
  const items = cart.map(item => ({ ...item, product: products.find(product => String(product.id) === item.produtoId) }));
  const invalid = items.some(item => !validQuantity(item.quantidade) || (!stale && !item.product));
  const total = items.reduce((sum, item) => sum + Math.round((item.product?.preco || 0) * Number(item.quantidade || 0) * 100), 0) / 100;

  return (
    <section className="container page">
      <a href="#cardapio" className="back-link"><ArrowLeft size={16} /> Continuar comprando</a>
      <div className="page-heading"><div><h1>Meu carrinho</h1><p>Revise os produtos e as quantidades antes de confirmar.</p></div></div>
      {!cart.length ? <EmptyState title="Seu carrinho está vazio." description="Adicione seus produtos favoritos pelo cardápio." />
        : loading && !products.length ? <Loading label="Conferindo os produtos do carrinho…" />
        : (
          <>
            {error && <ErrorState service="produtos" />}
            {stale && <p role="status">O pedido será salvo como pendente e processado quando os serviços estiverem disponíveis. Os preços podem mudar.</p>}
            <form className="cart-layout" onSubmit={event => { event.preventDefault(); if (!invalid && !submitting) onCheckout(); }}>
              <div className="cart-items">
                {items.map(item => (
                  <article className="cart-item" key={item.produtoId}>
                    <ProductImage src={images[item.product?.nome]} alt={item.product?.nome || 'Produto indisponível'} />
                    <div className="cart-description">
                      <h2>{item.product?.nome || 'Produto indisponível no catálogo'}</h2>
                      <p>{item.product ? money(item.product.preco) + ' por unidade' : 'Remova o produto ou tente atualizar o catálogo.'}</p>
                      <button className="remove-button" type="button" disabled={submitting} onClick={() => onRemove(item.produtoId)}><Trash2 size={15} /> Remover</button>
                    </div>
                    <div className="cart-quantity">
                      <Quantity label={'Quantidade de ' + (item.product?.nome || 'produto')} value={item.quantidade} onChange={value => onQuantity(item.produtoId, value)} disabled={submitting} />
                      <strong>{item.product ? money(item.product.preco * Number(item.quantidade || 0)) : '—'}</strong>
                      {!validQuantity(item.quantidade) && <span className="field-error">Informe uma quantidade inteira e positiva dentro do limite permitido.</span>}
                    </div>
                  </article>
                ))}
              </div>
              <aside className="order-summary">
                <h2>Resumo do pedido</h2>
                <div className="summary-line"><span>Quantidade de itens</span><strong>{cart.reduce((sum, item) => sum + Number(item.quantidade || 0), 0)}</strong></div>
                <div className="summary-total"><span>Total</span><strong>{items.every(item => item.product) ? money(total) : '—'}</strong></div>
                <p>Os preços e a disponibilidade são conferidos ao confirmar. Todos os itens serão registrados em uma única compra, com um único código de pedido.</p>
                <button className="button" disabled={submitting || invalid}>{submitting ? 'Confirmando…' : 'Confirmar pedido'}<ArrowRight size={17} /></button>
              </aside>
            </form>
          </>
        )}
    </section>
  );
}
