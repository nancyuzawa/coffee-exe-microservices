export default function TabInicio({ aoTrocarAba }) {
  return (
    <section className="tab-panel">
      <div className="wrap hero">
        <div className="hero-grid">
          <div>
            <p className="kicker">sistema operacional • café</p>
            <h1>
              compile seu
              <br />
              <span>café perfeito</span>.
            </h1>
            <p>
              Uma cafeteria para quem debuga o dia inteiro. Escolha os itens, ajuste a
              quantidade e confirme — o pedido entra direto na fila de execução.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <button className="btn" onClick={() => aoTrocarAba("cardapio")}>
                ver cardápio →
              </button>
              <button className="btn ghost" onClick={() => aoTrocarAba("historico")}>
                meus pedidos
              </button>
            </div>
          </div>

          <div className="terminal" aria-hidden="true">
            <div className="terminal-bar">
              <span className="terminal-dot red"></span>
              <span className="terminal-dot yellow"></span>
              <span className="terminal-dot green"></span>
              <span className="terminal-title">coffee.exe — bash</span>
            </div>
            <div className="terminal-body">
              <div className="terminal-line">
                <span className="terminal-prompt">$</span>
                <span>npm run dev</span>
              </div>
              <div className="terminal-line terminal-output">&gt; ms-cardapio@1.0.0 dev</div>
              <div className="terminal-line terminal-output ok">✔ conectado ao MySQL</div>
              <div className="terminal-line terminal-output ok">
                ✔ ms-cardapio rodando em :3001
              </div>
              <div className="terminal-line terminal-output ok">
                ✔ ms-pedidos rodando em :3002
              </div>
              <div className="terminal-line">
                <span className="terminal-prompt">$</span>
                <span>brew --status</span>
              </div>
              <div className="terminal-line terminal-output">brew.status = 200</div>
              <div className="terminal-line">
                <span className="terminal-prompt">$</span>
                <span className="terminal-cursor"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
