export default function Header({ modo, aoTrocarModo, totalCarrinho, aoAbrirPedido }) {
  const admin = modo === "admin";

  return (
    <header className={`bar ${admin ? "admin" : ""}`}>
      <div className="bar-inner">
        <span className="logo">
          <span className="logo-mark">☕</span>
          coffee.exe{admin && <span className="logo-suffix">/admin</span>}
        </span>

        <div className="bar-actions">
          <div className="mode-switch" role="group" aria-label="Modo de uso">
            <button
              type="button"
              className={!admin ? "on" : ""}
              aria-pressed={!admin}
              onClick={() => aoTrocarModo("cliente")}
            >
              cliente
            </button>
            <button
              type="button"
              className={admin ? "on admin" : ""}
              aria-pressed={admin}
              onClick={() => aoTrocarModo("admin")}
            >
              admin
            </button>
          </div>

          {!admin && (
            <button className="cart-chip" onClick={aoAbrirPedido}>
              🛒 <span>{totalCarrinho}</span> <span className="cart-txt">no pedido</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
