import { useState } from "react";
import { formatarCpf, somenteDigitos } from "../utils/cpf";

function fmt(v) {
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

export default function TabAdminPedidos({ pedidos, carregando, erro, aoCancelar }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [confirmandoId, setConfirmandoId] = useState(null);

  // ---- números gerais (sempre sobre todos os pedidos, sem filtro) ----
  const realizados = pedidos.filter((p) => p.status === "REALIZADO");
  const faturamento = realizados.reduce((s, p) => s + Number(p.valorTotal), 0);
  const clientes = new Set(pedidos.map((p) => p.cpfCliente).filter(Boolean)).size;

  // ---- filtro por nome, CPF, item ou código do pedido ----
  const termo = busca.trim().toLowerCase();
  const digitos = somenteDigitos(busca);
  const filtrados = pedidos.filter((p) => {
    if (status !== "TODOS" && p.status !== status) return false;
    if (!termo) return true;
    return (
      (p.nomeCliente || "").toLowerCase().includes(termo) ||
      (p.nomeItem || "").toLowerCase().includes(termo) ||
      p.id.toLowerCase().startsWith(termo) ||
      (digitos !== "" && (p.cpfCliente || "").includes(digitos))
    );
  });

  async function handleCancelar(id) {
    setConfirmandoId(null);
    await aoCancelar(id);
  }

  return (
    <section className="tab-panel">
      <div className="wrap">
        <p className="kicker">admin · process log</p>
        <h2>todos os pedidos</h2>
        <p className="lede">
          O histórico completo de todos os clientes. Busque por nome, CPF, item ou código do
          pedido.
        </p>

        <div className="stats">
          <div className="stat">
            <span className="stat-n">{pedidos.length}</span>
            <span className="stat-l">pedidos</span>
          </div>
          <div className="stat">
            <span className="stat-n">{clientes}</span>
            <span className="stat-l">clientes</span>
          </div>
          <div className="stat">
            <span className="stat-n amber">{fmt(faturamento)}</span>
            <span className="stat-l">faturado (sem cancelados)</span>
          </div>
        </div>

        <div className="filters">
          <input
            type="search"
            aria-label="Buscar pedidos"
            placeholder="buscar por nome, cpf, item ou código…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="TODOS">todos os status</option>
            <option value="REALIZADO">preparados</option>
            <option value="CANCELADO">cancelados</option>
          </select>
        </div>

        <div className="log">
          {carregando && <div className="log-empty">carregando pedidos…</div>}
          {erro && <div className="log-empty">{erro}</div>}
          {!carregando && !erro && pedidos.length === 0 && (
            <div className="log-empty">nenhum pedido foi feito ainda.</div>
          )}
          {!carregando && !erro && pedidos.length > 0 && filtrados.length === 0 && (
            <div className="log-empty">nenhum pedido corresponde à busca.</div>
          )}

          {!carregando &&
            !erro &&
            filtrados.map((pedido) => {
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

                  <p className="log-cliente">
                    <strong>{pedido.nomeCliente || "cliente não identificado"}</strong>
                    <span>{pedido.cpfCliente ? formatarCpf(pedido.cpfCliente) : "CPF não informado"}</span>
                  </p>

                  <div className="log-foot">
                    <p className="log-items">
                      {pedido.quantidade}× {pedido.nomeItem}
                    </p>
                    <div className="log-total">{fmt(pedido.valorTotal)}</div>
                    {!cancelado && (
                      <div className="row-actions">
                        {confirmandoId === pedido.id ? (
                          <>
                            <button className="mini danger" onClick={() => handleCancelar(pedido.id)}>
                              confirmar cancelamento
                            </button>
                            <button className="mini" onClick={() => setConfirmandoId(null)}>
                              voltar
                            </button>
                          </>
                        ) : (
                          <button className="mini" onClick={() => setConfirmandoId(pedido.id)}>
                            cancelar pedido
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
