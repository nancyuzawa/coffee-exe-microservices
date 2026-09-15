function fmt(v) {
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

export default function TabHistorico({ pedidos, carregando, erro }) {
  return (
    <section className="tab-panel">
      <div className="wrap">
        <p className="kicker">03 · process log</p>
        <h2>histórico de pedidos</h2>
        <p className="lede">
          Registro dos pedidos já confirmados, do mais recente ao mais antigo — vindo direto
          do microsserviço de pedidos.
        </p>

        <div className="log">
          {carregando && <div className="log-empty">carregando histórico…</div>}
          {erro && <div className="log-empty">{erro}</div>}
          {!carregando && !erro && pedidos.length === 0 && (
            <div className="log-empty">
              nenhum pedido confirmado ainda. seu histórico aparece aqui.
            </div>
          )}
          {!carregando &&
            !erro &&
            pedidos.map((pedido) => {
              const d = new Date(pedido.dataPedido);
              const timeStr = d.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              const cancelado = pedido.status === "CANCELADO";

              return (
                <div className="log-entry" key={pedido.id}>
                  <div className="log-head">
                    <span>
                      #<span className="log-id">{pedido.id.slice(0, 8)}</span> · {timeStr}
                    </span>
                    <span className={`status-badge ${cancelado ? "cancelado" : ""}`}>
                      {cancelado ? "cancelado ✕" : "preparado ✓"}
                    </span>
                  </div>
                  <p className="log-items">
                    {pedido.quantidade}× {pedido.nomeItem}
                  </p>
                  <div className="log-total">{fmt(pedido.valorTotal)}</div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
