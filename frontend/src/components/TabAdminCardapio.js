import { useState } from "react";

function fmt(v) {
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

const FORM_VAZIO = { nome: "", preco: "", descricao: "", estoque: "0" };

export default function TabAdminCardapio({
  itens,
  carregando,
  erro,
  aoSalvar,
  aoExcluir,
  aoAjustarEstoque,
}) {
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erroForm, setErroForm] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState(null);

  const campo = (nome) => (e) => setForm((f) => ({ ...f, [nome]: e.target.value }));

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setForm({
      nome: item.nome,
      preco: String(item.preco).replace(".", ","),
      descricao: item.descricao || "",
      estoque: String(item.estoque),
    });
    setErroForm(null);
    setConfirmandoId(null);
    document.getElementById("form-item")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function limparForm() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErroForm(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const preco = Number(form.preco.replace(",", "."));
    const estoque = Number(form.estoque);

    if (form.nome.trim() === "") return setErroForm("Informe o nome do item.");
    if (form.preco.trim() === "" || !Number.isFinite(preco) || preco < 0) {
      return setErroForm("Informe um preço válido, maior ou igual a zero.");
    }
    if (form.estoque.trim() === "" || !Number.isInteger(estoque) || estoque < 0) {
      return setErroForm("O estoque deve ser um número inteiro, maior ou igual a zero.");
    }

    setErroForm(null);
    setSalvando(true);
    const ok = await aoSalvar(
      { nome: form.nome.trim(), preco, descricao: form.descricao.trim(), estoque },
      editandoId
    );
    setSalvando(false);
    if (ok) limparForm();
  }

  async function handleExcluir(id) {
    setConfirmandoId(null);
    if (editandoId === id) limparForm();
    await aoExcluir(id);
  }

  return (
    <section className="tab-panel">
      <div className="wrap">
        <p className="kicker">admin · menu.json</p>
        <h2>gerenciar cardápio</h2>
        <p className="lede">
          Cadastre, edite, reponha o estoque ou remova itens. Tudo é gravado no banco do
          microsserviço de cardápio e aparece na hora para os clientes.
        </p>

        <div className="admin-layout">
          <form className="panel-form" id="form-item" onSubmit={handleSubmit} noValidate>
            <h3>{editandoId ? "editar item" : "novo item"}</h3>

            <div className="field">
              <label htmlFor="item-nome">nome</label>
              <input id="item-nome" type="text" value={form.nome} onChange={campo("nome")} placeholder="Cappuccino" />
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="item-preco">preço (R$)</label>
                <input
                  id="item-preco"
                  type="text"
                  inputMode="decimal"
                  value={form.preco}
                  onChange={campo("preco")}
                  placeholder="12,50"
                />
              </div>
              <div className="field">
                <label htmlFor="item-estoque">estoque</label>
                <input
                  id="item-estoque"
                  type="text"
                  inputMode="numeric"
                  value={form.estoque}
                  onChange={campo("estoque")}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="item-desc">descrição</label>
              <textarea
                id="item-desc"
                rows={3}
                value={form.descricao}
                onChange={campo("descricao")}
                placeholder="Espresso com leite vaporizado"
              />
            </div>

            {erroForm && <p className="field-erro" role="alert">{erroForm}</p>}

            <div className="form-actions">
              <button className="btn" type="submit" disabled={salvando}>
                {salvando ? "salvando..." : editandoId ? "salvar alterações" : "cadastrar item"}
              </button>
              {editandoId && (
                <button className="btn ghost" type="button" onClick={limparForm}>
                  cancelar edição
                </button>
              )}
            </div>
          </form>

          <div className="admin-list">
            {carregando && <div className="log-empty">carregando cardápio…</div>}
            {erro && <div className="log-empty">{erro}</div>}
            {!carregando && !erro && itens.length === 0 && (
              <div className="log-empty">
                nenhum item cadastrado. use o formulário ao lado para criar o primeiro.
              </div>
            )}

            {!erro &&
              itens.map((item) => (
                <div className={`adm-item ${editandoId === item.id ? "editing" : ""}`} key={item.id}>
                  <div className="adm-main">
                    <div className="adm-name">
                      {item.nome} <span className="item-id">{item.id.slice(0, 8)}</span>
                    </div>
                    {item.descricao && <div className="adm-desc">{item.descricao}</div>}
                  </div>

                  <span className="price">{fmt(item.preco)}</span>

                  <div className="stock-ctrl" title="estoque">
                    <button
                      type="button"
                      aria-label={`diminuir estoque de ${item.nome}`}
                      disabled={item.estoque <= 0}
                      onClick={() => aoAjustarEstoque(item.id, -1)}
                    >
                      −
                    </button>
                    <span className={item.estoque <= 0 ? "zero" : ""}>{item.estoque}</span>
                    <button
                      type="button"
                      aria-label={`aumentar estoque de ${item.nome}`}
                      onClick={() => aoAjustarEstoque(item.id, 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="row-actions">
                    {confirmandoId === item.id ? (
                      <>
                        <button className="mini danger" onClick={() => handleExcluir(item.id)}>
                          confirmar exclusão
                        </button>
                        <button className="mini" onClick={() => setConfirmandoId(null)}>
                          voltar
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="mini" onClick={() => iniciarEdicao(item)}>
                          editar
                        </button>
                        <button className="mini" onClick={() => setConfirmandoId(item.id)}>
                          excluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
