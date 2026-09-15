import { useState } from "react";

function fmt(v) {
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

function ItemCard({ item, aoAdicionar }) {
  const [qtd, setQtd] = useState(1);
  const [adicionado, setAdicionado] = useState(false);
  const semEstoque = item.estoque <= 0;

  function diminuir() {
    setQtd((q) => Math.max(1, q - 1));
  }

  function aumentar() {
    setQtd((q) => Math.min(item.estoque, q + 1));
  }

  function handleAdicionar() {
    aoAdicionar(item.id, qtd);
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 900);
  }

  return (
    <div className="item-card">
      <div>
        <div className="item-id">{item.id.slice(0, 8)}</div>
        <div className="item-name">{item.nome}</div>
      </div>
      <p className="item-desc">{item.descricao}</p>
      <div className="item-tags">
        <span className="tag">{semEstoque ? "esgotado" : `estoque: ${item.estoque}`}</span>
      </div>
      <div className="item-bottom">
        <span className="price">{fmt(item.preco)}</span>
        <div className="stepper">
          <button type="button" aria-label="diminuir quantidade" onClick={diminuir}>
            −
          </button>
          <span>{qtd}</span>
          <button type="button" aria-label="aumentar quantidade" onClick={aumentar}>
            +
          </button>
        </div>
      </div>
      <div className="add-row">
        <button
          className={`add-btn ${adicionado ? "added" : ""}`}
          onClick={handleAdicionar}
          disabled={semEstoque}
        >
          {adicionado ? "adicionado ✓" : semEstoque ? "sem estoque" : "adicionar ao pedido"}
        </button>
      </div>
    </div>
  );
}

export default function TabCardapio({ itens, carregando, erro, aoAdicionar }) {
  return (
    <section className="tab-panel">
      <div className="wrap">
        <p className="kicker">01 · menu.json</p>
        <h2>cardápio</h2>
        <p className="lede">
          Cada item vem direto do microsserviço de cardápio. Ajuste a quantidade e adicione
          ao pedido — nada é enviado até você confirmar na aba de pedido.
        </p>

        {carregando && <p>Carregando cardápio...</p>}
        {erro && <p className="log-empty">{erro}</p>}
        {!carregando && !erro && itens.length === 0 && (
          <p className="log-empty">Nenhum item cadastrado no cardápio ainda.</p>
        )}

        {!carregando && !erro && itens.length > 0 && (
          <div className="menu-grid">
            {itens.map((item) => (
              <ItemCard key={item.id} item={item} aoAdicionar={aoAdicionar} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
