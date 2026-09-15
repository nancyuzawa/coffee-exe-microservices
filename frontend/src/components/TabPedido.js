function fmt(v) {
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

const TAXA_SISTEMA = 1.5; // valor exibido apenas no frontend, não é enviado ao backend

export default function TabPedido({
  linhasCarrinho,
  aoAlterarQtd,
  aoRemover,
  aoConfirmar,
  enviando,
}) {
  const totalUnidades = linhasCarrinho.reduce((s, l) => s + l.qtd, 0);
  const subtotal = linhasCarrinho.reduce((s, l) => s + l.item.preco * l.qtd, 0);
  const taxa = linhasCarrinho.length > 0 ? TAXA_SISTEMA : 0;
  const total = subtotal + taxa;

  return (
    <section className="tab-panel">
      <div className="wrap">
        <p className="kicker">02 · build queue</p>
        <h2>seu pedido</h2>
        <p className="lede">
          Revise os itens selecionados, corrija quantidades e confirme para enviar ao
          microsserviço de pedidos.
        </p>

        <div className="order-layout">
          <div className="queue">
            {linhasCarrinho.length === 0 ? (
              <div className="queue-empty">
                nenhum item na fila ainda — adicione algo na aba cardápio.
              </div>
            ) : (
              linhasCarrinho.map(({ item, qtd }) => (
                <div className="queue-line" key={item.id}>
                  <span className="queue-name">{item.nome}</span>
                  <div className="stepper">
                    <button
                      type="button"
                      aria-label="diminuir"
                      onClick={() => aoAlterarQtd(item.id, qtd - 1)}
                    >
                      −
                    </button>
                    <span>{qtd}</span>
                    <button
                      type="button"
                      aria-label="aumentar"
                      onClick={() => aoAlterarQtd(item.id, qtd + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="queue-sub">{fmt(item.preco * qtd)}</span>
                  <button
                    className="remove-btn"
                    aria-label="remover item"
                    onClick={() => aoRemover(item.id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="summary">
            <h3>resumo</h3>
            <div className="sum-row">
              <span>itens</span>
              <span>{totalUnidades}</span>
            </div>
            <div className="sum-row">
              <span>taxa de sistema</span>
              <span>{fmt(taxa)}</span>
            </div>
            <div className="sum-total">
              <span>total</span>
              <span>{fmt(total)}</span>
            </div>
            <button
              className="btn full"
              disabled={linhasCarrinho.length === 0 || enviando}
              onClick={aoConfirmar}
            >
              {enviando ? "enviando..." : "confirmar pedido"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
