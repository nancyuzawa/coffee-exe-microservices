import { useState } from "react";
import { cpfValido, formatarCpf, somenteDigitos } from "../utils/cpf";

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
  cliente,
  aoAlterarCliente,
}) {
  const [mostrarErros, setMostrarErros] = useState(false);

  const totalUnidades = linhasCarrinho.reduce((s, l) => s + l.qtd, 0);
  const subtotal = linhasCarrinho.reduce((s, l) => s + l.item.preco * l.qtd, 0);
  const taxa = linhasCarrinho.length > 0 ? TAXA_SISTEMA : 0;
  const total = subtotal + taxa;

  const erroNome = cliente.nome.trim().length < 3 ? "Informe seu nome (mínimo 3 letras)." : null;
  const erroCpf = cpfValido(cliente.cpf) ? null : "Informe um CPF válido, com 11 dígitos.";

  function handleConfirmar() {
    if (erroNome || erroCpf) {
      setMostrarErros(true);
      return;
    }
    aoConfirmar();
  }

  return (
    <section className="tab-panel">
      <div className="wrap">
        <p className="kicker">02 · build queue</p>
        <h2>seu pedido</h2>
        <p className="lede">
          Revise os itens, corrija as quantidades e identifique-se com nome e CPF. É assim que
          seus pedidos ficam separados dos de outros clientes.
        </p>

        <div className="order-layout">
          <div className="order-left">
            <div className="queue">
              {linhasCarrinho.length === 0 ? (
                <div className="queue-empty">
                  nenhum item na fila ainda — adicione algo na aba cardápio.
                </div>
              ) : (
                linhasCarrinho.map(({ item, qtd }) => {
                  const noLimiteDeEstoque = qtd >= item.estoque;
                  return (
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
                          disabled={noLimiteDeEstoque}
                          title={noLimiteDeEstoque ? "estoque no limite" : undefined}
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
                      {noLimiteDeEstoque && (
                        <span className="field-erro queue-erro">estoque no limite ({item.estoque})</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="panel-form">
              <h3>quem está pedindo</h3>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="cli-nome">nome</label>
                  <input
                    id="cli-nome"
                    type="text"
                    autoComplete="name"
                    placeholder="Maria da Silva"
                    value={cliente.nome}
                    onChange={(e) => aoAlterarCliente({ ...cliente, nome: e.target.value })}
                    aria-invalid={mostrarErros && !!erroNome}
                  />
                  {mostrarErros && erroNome && <span className="field-erro">{erroNome}</span>}
                </div>
                <div className="field">
                  <label htmlFor="cli-cpf">cpf</label>
                  <input
                    id="cli-cpf"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={formatarCpf(cliente.cpf)}
                    onChange={(e) =>
                      aoAlterarCliente({ ...cliente, cpf: somenteDigitos(e.target.value).slice(0, 11) })
                    }
                    aria-invalid={mostrarErros && !!erroCpf}
                  />
                  {mostrarErros && erroCpf && <span className="field-erro">{erroCpf}</span>}
                </div>
              </div>
            </div>
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
              onClick={handleConfirmar}
            >
              {enviando ? "enviando..." : "confirmar pedido"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
