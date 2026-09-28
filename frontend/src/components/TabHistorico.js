import { useState } from "react";
import { cpfValido, formatarCpf } from "../utils/cpf";

function fmt(v) {
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

// Sem CPF identificado, pedimos o CPF para mostrar só os pedidos daquela pessoa.
function ConsultaPorCpf({ aoIdentificar }) {
  const [cpf, setCpf] = useState("");
  const [tentou, setTentou] = useState(false);
  const invalido = !cpfValido(cpf);

  function consultar(e) {
    e.preventDefault();
    if (invalido) {
      setTentou(true);
      return;
    }
    aoIdentificar(cpf);
  }

  return (
    <form className="panel-form consulta" onSubmit={consultar}>
      <h3>ver meus pedidos</h3>
      <div className="field">
        <label htmlFor="hist-cpf">cpf usado no pedido</label>
        <div className="field-inline">
          <input
            id="hist-cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={formatarCpf(cpf)}
            onChange={(e) => setCpf(e.target.value)}
            aria-invalid={tentou && invalido}
          />
          <button className="btn" type="submit">
            consultar
          </button>
        </div>
        {tentou && invalido && <span className="field-erro">Informe um CPF válido, com 11 dígitos.</span>}
      </div>
    </form>
  );
}

export default function TabHistorico({ pedidos, carregando, erro, cliente, aoIdentificar, aoTrocarCliente }) {
  const identificado = cpfValido(cliente.cpf);

  return (
    <section className="tab-panel">
      <div className="wrap">
        <p className="kicker">03 · process log</p>
        <h2>meus pedidos</h2>
        <p className="lede">
          Só aparecem os pedidos feitos com o seu CPF, do mais recente ao mais antigo — vindo
          direto do microsserviço de pedidos.
        </p>

        {!identificado && <ConsultaPorCpf aoIdentificar={aoIdentificar} />}

        {identificado && (
          <>
            <div className="whoami">
              <span>
                {cliente.nome.trim() ? <strong>{cliente.nome.trim()}</strong> : "cliente"} ·{" "}
                {formatarCpf(cliente.cpf)}
              </span>
              <button className="link-btn" onClick={aoTrocarCliente}>
                não sou eu
              </button>
            </div>

            <div className="log">
              {carregando && <div className="log-empty">carregando histórico…</div>}
              {erro && <div className="log-empty">{erro}</div>}
              {!carregando && !erro && pedidos.length === 0 && (
                <div className="log-empty">
                  nenhum pedido com este CPF ainda. faça um pedido na aba cardápio.
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
          </>
        )}
      </div>
    </section>
  );
}
