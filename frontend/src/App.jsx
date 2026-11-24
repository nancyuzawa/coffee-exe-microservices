import { useEffect, useRef, useState } from 'react';
import { Coffee, Menu, ShoppingBag, X } from 'lucide-react';
import Catalog from './components/Catalog';
import Cart from './components/Cart';
import Orders from './components/Orders';
import { getOrders, getProducts } from './services/api';
import { validQuantity } from './lib/format';
import usePersistentList from './lib/usePersistentList';
import useOrderQueue from './lib/useOrderQueue';

const validProduct = value => value && typeof value.id === 'string' && typeof value.nome === 'string' && Number.isFinite(value.preco);
const validOrder = value => value && typeof value.id === 'string' && Array.isArray(value.itens) && value.itens.every(item => item && typeof item.produtoId === 'string' && Number.isFinite(item.precoUnitario) && Number.isInteger(item.quantidade));

const currentPage = () => ['carrinho', 'pedidos'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'cardapio';
export default function App() {
  const [page, setPage] = useState(currentPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const { data: products, loading: productsLoading, error: productsError, stale: productsStale, refresh: refreshProducts } = usePersistentList('meow-products-api', getProducts, 'produtos', validProduct);
  const { data: orders, loading: ordersLoading, error: ordersError, stale: ordersStale, refresh: refreshOrders } = usePersistentList('meow-orders-api', getOrders, 'pedidos', validOrder);
  const queue = useOrderQueue(refreshOrders);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const sending = useRef(false);
  const checkoutRequest = useRef(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => { refreshProducts(); }, [refreshProducts]);
  useEffect(() => { if (page === 'carrinho') refreshProducts(); }, [page, refreshProducts]);
  useEffect(() => { if (page === 'pedidos') refreshOrders(); }, [page, refreshOrders]);
  useEffect(() => {
    const change = () => {
      if (!['', '#cardapio', '#carrinho', '#pedidos'].includes(location.hash)) return;
      setPage(currentPage());
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);

  function add(product, quantity) {
    if (sending.current) return;
    const existing = cart.find(item => item.produtoId === String(product.id))?.quantidade || 0;
    if (!validQuantity(quantity) || !validQuantity(existing + Number(quantity))) {
      setNotice({ message: 'Informe uma quantidade inteira e positiva dentro do limite permitido.', error: true });
      return;
    }
    setCart(items => existing
      ? items.map(item => item.produtoId === String(product.id) ? { ...item, quantidade: item.quantidade + quantity } : item)
      : [...items, { produtoId: String(product.id), quantidade: quantity }]);
    setNotice({ message: product.nome + ' adicionado ao carrinho.', error: false, cart: true });
  }

  async function checkout() {
    if (sending.current || !cart.length) return;
    if (cart.some(item => !validQuantity(item.quantidade) || (!productsStale && !products.some(product => String(product.id) === item.produtoId)))) {
      setNotice({ message: 'Atualize o catálogo e revise as quantidades antes de confirmar.', error: true });
      return;
    }
    sending.current = true;
    setSubmitting(true);
    setNotice(null);
    try {
      const itens = cart.map(item => ({
        produtoId: item.produtoId,
        nomeProduto: products.find(product => String(product.id) === item.produtoId)?.nome,
        quantidade: Number(item.quantidade),
      }));
      const signature = JSON.stringify(itens);
      if (checkoutRequest.current?.signature !== signature) checkoutRequest.current = { signature, id: crypto.randomUUID() };
      const order = await queue.enqueue(itens, checkoutRequest.current.id);
      checkoutRequest.current = null;
      setCart([]);
      setNotice({ message: 'Pedido #' + order.requestId + ' salvo para processamento. Acompanhe a confirmação em Meus Pedidos.', error: false });
      location.hash = 'pedidos';
      setPage('pedidos');
    } catch (error) {
      setNotice({
        message: error.message,
        error: true,
      });
    } finally {
      sending.current = false;
      setSubmitting(false);
      refreshProducts();
    }
  }

  const count = cart.reduce((sum, item) => sum + Number(item.quantidade || 0), 0);
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="site-header">
        <div className="container header-main">
          <a className="brand" href="#cardapio">
            <img src="/logo-meow.png" alt="" width="44" height="44" />
            <div><strong>Meow Coffee</strong><small>Café, carinho e um toque de Natal.</small></div>
          </a>
          <button className="icon-button menu-toggle" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          <nav className={'main-nav' + (menuOpen ? ' is-open' : '')} aria-label="Navegação principal">
            <a href="#cardapio" aria-current={page === 'cardapio' ? 'page' : undefined}>Início & Cardápio</a>
            <a href="#carrinho" aria-current={page === 'carrinho' ? 'page' : undefined} className="cart-link"><ShoppingBag size={16} /> Meu Carrinho <span className="cart-count">{count}</span></a>
            <a href="#pedidos" aria-current={page === 'pedidos' ? 'page' : undefined}>Meus Pedidos</a>
          </nav>
        </div>
        <div className="announcement">Cafés e biscoitos artesanais preparados com carinho.</div>
      </header>
      <main id="conteudo">
        {queue.error && <div className="notice error" role="alert">{queue.error}</div>}
        {notice && (
          <div className={'notice ' + (notice.error ? 'error' : 'success')} role={notice.error ? 'alert' : 'status'}>
            <span>{notice.message}</span>
            {notice.cart && <a className="notice-link" href="#carrinho">Ver carrinho</a>}
            <button className="icon-button" aria-label="Fechar mensagem" onClick={() => setNotice(null)}><X size={18} /></button>
          </div>
        )}
        {page === 'cardapio' && <Catalog products={products} cart={cart} loading={productsLoading} error={productsError} stale={productsStale} retry={refreshProducts} onAdd={add} submitting={submitting} />}
        {page === 'carrinho' && <Cart cart={cart} products={products} loading={productsLoading} error={productsError} stale={productsStale} retry={refreshProducts} submitting={submitting} onCheckout={checkout}
          onQuantity={(id, quantity) => { if (!sending.current) setCart(items => items.map(item => item.produtoId === id ? { ...item, quantidade: quantity } : item)); }}
          onRemove={id => { if (!sending.current) setCart(items => items.filter(item => item.produtoId !== id)); }} />}
        {page === 'pedidos' && <Orders orders={orders} loading={ordersLoading} error={ordersError} stale={ordersStale} retry={refreshOrders} pendingOrders={queue.orders} onRetryPending={queue.retry} onRemovePending={queue.remove} />}
      </main>
      <footer><div className="container"><Coffee size={18} /> Meow Coffee · {new Date().getFullYear()}</div></footer>
    </>
  );
}
