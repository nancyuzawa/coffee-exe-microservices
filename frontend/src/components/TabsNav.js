export default function TabsNav({ abas, abaAtiva, aoTrocarAba, totalCarrinho }) {
  return (
    <div className="tabs-nav">
      <div className="tabs-nav-inner">
        {abas.map((aba) => (
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
