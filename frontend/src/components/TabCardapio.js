import { useEffect, useState } from "react";

function fmt(v) {
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

// `qtdNoCarrinho` é quanto desse item o cliente já colocou na fila (aba
// pedido). O que ele ainda pode adicionar é o estoque total menos isso —
// senão dá pra continuar adicionando um item que já esgotou no carrinho.
function ItemCard({ item, qtdNoCarrinho, aoAdicionar }) {
  const restante = item.estoque - qtdNoCarrinho;
  const semEstoque = restante <= 0;

  const [qtd, setQtd] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  // se o restante cair (outro cliente comprou, ou este mesmo já colocou mais
  // na fila), garante que a quantidade selecionada não fique acima do limite
  useEffect(() => {
    setQtd((q) => Math.min(q, Math.max(restante, 1)));
  }, [restante]);

  function diminuir() {
    setQtd((q) => Math.max(1, q - 1));
  }

  function aumentar() {
    setQtd((q) => Math.min(Math.max(restante, 1), q + 1));
  }

  function handleAdicionar() {
    const qtdParaAdicionar = Math.min(qtd, restante);
    if (qtdParaAdicionar <= 0) return;
    aoAdicionar(item.id, qtdParaAdicionar);
    setQtd(1);
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
        <span className="tag">{semEstoque ? "esgotado" : `estoque: ${restante}`}</span>
      </div>
      <div className="item-bottom">
        <span className="price">{fmt(item.preco)}</span>
        <div className="stepper">
          <button
            type="button"
            aria-label="diminuir quantidade"
            onClick={diminuir}
            disabled={semEstoque}
          >
            −
          </button>
          <span>{qtd}</span>
          <button
            type="button"
            aria-label="aumentar quantidade"
            onClick={aumentar}
            disabled={semEstoque || qtd >= restante}
          >
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

export default function TabCardapio({ itens, carregando, erro, carrinho, aoAdicionar }) {
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
              <ItemCard
                key={item.id}
                item={item}
                qtdNoCarrinho={(carrinho && carrinho[item.id]) || 0}
                aoAdicionar={aoAdicionar}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
