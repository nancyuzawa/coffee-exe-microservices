export default function Header({ totalCarrinho, aoAbrirPedido }) {
  return (
    <header className="bar">
      <div className="bar-inner">
        <button className="logo" onClick={() => {}}>
          <span className="logo-mark">☕</span>
          coffee.exe
        </button>
        <button className="cart-chip" onClick={aoAbrirPedido}>
          🛒 <span>{totalCarrinho}</span> no pedido
        </button>
      </div>
    </header>
  );
}
