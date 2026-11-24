import { useState } from 'react';
import { Coffee, ArrowRight, ShoppingBag } from 'lucide-react';
import { Quantity, ProductImage, EmptyState, Loading, ErrorState } from './ui';
import { money, validQuantity } from '../lib/format';
import images from '../data/images.json';
import Reviews from './Reviews';

function ProductCard({ product, onAdd, submitting }) {
  const [quantity, setQuantity] = useState(1);
  const valid = validQuantity(quantity);
  return (
    <article className="product-card">
      <ProductImage src={images[product.nome]} alt={product.nome} loading="lazy" />
      <div className="product-content">
        <h3>{product.nome}</h3>
        <p>{product.descricao}</p>
        <div className="price-row"><strong>{money(product.preco)}</strong></div>
        <form className="card-actions" onSubmit={event => { event.preventDefault(); if (valid) onAdd(product, Number(quantity)); }}>
          <Quantity label={'Quantidade de ' + product.nome} value={quantity} onChange={setQuantity} disabled={submitting} />
          <button className="button" disabled={submitting || !valid}><ShoppingBag size={16} /> Adicionar</button>
        </form>
        <Reviews product={product} />
      </div>
    </article>
  );
}

export default function Catalog({ products, cart, loading, error, stale, retry, onAdd, submitting }) {
  return (
    <>
      <section className="hero container">
        <div>
          <span className="eyebrow">Meow Coffee · Cardápio de Natal</span>
          <h1>Café quentinho.<br />Biscoitos artesanais.<br /><span>Carinho em cada patinha.</span></h1>
          <p>Conheça nossos produtos e escolha o sabor da sua próxima pausa.</p>
          <a className="button" href="#produtos"><Coffee size={18} /> Explorar o cardápio <ArrowRight size={16} /></a>
        </div>
        <ProductImage src="/assets/hero-banner.png" alt="Café natalino em uma caneca de gatinho" fetchPriority="high" />
      </section>
      <section className="menu-section" id="produtos">
        <div className="container">
          <h2>Nosso cardápio</h2>
          <p className="section-description">Adicione seus produtos favoritos ao carrinho e revise antes de confirmar.</p>
          {error && <ErrorState service="produtos" />}
          {!error && stale && products.length > 0 && <p role="status">Exibindo o último catálogo salvo. Os preços serão conferidos ao processar o pedido.</p>}
          {loading && !products.length ? <Loading label="Buscando produtos…" />
            : products.length ? <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} onAdd={onAdd} submitting={submitting} />)}</div>
            : error ? null
            : <EmptyState title="Nenhum produto cadastrado." description="Os produtos cadastrados na API aparecerão aqui." />}
        </div>
      </section>
    </>
  );
}
