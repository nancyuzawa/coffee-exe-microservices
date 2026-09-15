const ABAS = [
  { id: "inicio", idx: "00", label: "início" },
  { id: "cardapio", idx: "01", label: "cardápio" },
  { id: "pedido", idx: "02", label: "pedido" },
  { id: "historico", idx: "03", label: "histórico" },
];

export default function TabsNav({ abaAtiva, aoTrocarAba, totalCarrinho }) {
  return (
    <div className="tabs-nav">
      <div className="tabs-nav-inner">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            className={`tab-btn ${abaAtiva === aba.id ? "active" : ""}`}
            onClick={() => aoTrocarAba(aba.id)}
          >
            <span className="idx">{aba.idx}</span> {aba.label}
            {aba.id === "pedido" && <span className="count">{totalCarrinho}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
