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

          <div className="hero-art" aria-hidden="true">
            <svg viewBox="0 0 420 360" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="cupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1C2B20" />
                  <stop offset="100%" stopColor="#16241A" />
                </linearGradient>
              </defs>
              <g stroke="#2A3F30" strokeWidth="2" fill="none">
                <path d="M20 60 H120 V100" />
                <path d="M20 180 H90" />
                <path d="M400 60 H300 V110" />
                <path d="M400 200 H330 V240" />
                <path d="M40 300 H140" />
              </g>
              <circle cx="20" cy="60" r="4" fill="#C87941" />
              <circle cx="20" cy="180" r="4" fill="#4ADE80" />
              <circle cx="400" cy="60" r="4" fill="#C87941" />
              <circle cx="400" cy="200" r="4" fill="#4ADE80" />
              <circle cx="40" cy="300" r="4" fill="#E8A33D" />
              <rect x="140" y="120" width="140" height="130" rx="10" fill="url(#cupGrad)" stroke="#2A3F30" strokeWidth="2" />
              <path d="M280 145 Q320 145 320 180 Q320 215 280 215" fill="none" stroke="#2A3F30" strokeWidth="8" />
              <g stroke="#C87941" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <path d="M160 240 V190 H190 V165" />
                <path d="M195 240 V210 H230" />
                <path d="M260 240 V200 H245 V175" />
              </g>
              <circle cx="190" cy="165" r="4" fill="#E8A33D" />
              <circle cx="230" cy="210" r="4" fill="#E8A33D" />
              <circle cx="245" cy="175" r="4" fill="#E8A33D" />
              <rect x="120" y="250" width="180" height="12" rx="6" fill="#1C2B20" stroke="#2A3F30" strokeWidth="2" />
              <g stroke="#4ADE80" strokeWidth="2" fill="none" opacity="0.8">
                <path d="M170 110 Q180 90 170 70 Q160 50 170 30" />
                <path d="M210 110 Q220 90 210 70 Q200 50 210 30" />
                <path d="M250 110 Q260 90 250 70 Q240 50 250 30" />
              </g>
              <text x="145" y="105" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#8FA396">
                brew.status = 200
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
