import { useEffect, useState } from "react";
import Header from "./components/Header";
import TabsNav from "./components/TabsNav";
import TabInicio from "./components/TabInicio";
import TabCardapio from "./components/TabCardapio";
import TabPedido from "./components/TabPedido";
import TabHistorico from "./components/TabHistorico";
import TabAdminCardapio from "./components/TabAdminCardapio";
import TabAdminPedidos from "./components/TabAdminPedidos";
import Toast from "./components/Toast";
import { ajustarEstoque, atualizarItem, buscarCardapio, criarItem, removerItem } from "./api/cardapioApi";
import { buscarPedidos, cancelarPedido, criarPedido } from "./api/pedidosApi";
import { cpfValido, somenteDigitos } from "./utils/cpf";
import "./App.css";

const ABAS_CLIENTE = [
  { id: "inicio", idx: "00", label: "início" },
  { id: "cardapio", idx: "01", label: "cardápio" },
  { id: "pedido", idx: "02", label: "pedido" },
  { id: "historico", idx: "03", label: "meus pedidos" },
];

const ABAS_ADMIN = [
  { id: "admin-cardapio", idx: "01", label: "cardápio" },
  { id: "admin-pedidos", idx: "02", label: "todos os pedidos" },
];

// o cliente fica salvo no navegador para não precisar digitar nome/CPF a cada pedido
const CHAVE_CLIENTE = "coffee-exe:cliente";

function lerClienteSalvo() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_CLIENTE));
    if (salvo && typeof salvo.nome === "string" && typeof salvo.cpf === "string") return salvo;
  } catch {
    // sem localStorage ou conteúdo inválido: começa vazio
  }
  return { nome: "", cpf: "" };
}

export default function App() {
  const [modo, setModo] = useState("cliente"); // "cliente" | "admin"
  const [abaAtiva, setAbaAtiva] = useState("inicio");

  const [itens, setItens] = useState([]);
  const [carregandoCardapio, setCarregandoCardapio] = useState(true);
  const [erroCardapio, setErroCardapio] = useState(null);

  // pedidos do cliente identificado (por CPF) e pedidos de todos (admin)
  const [pedidosCliente, setPedidosCliente] = useState([]);
  const [pedidosAdmin, setPedidosAdmin] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [erroPedidos, setErroPedidos] = useState(null);

  const [cliente, setCliente] = useState(lerClienteSalvo); // { nome, cpf }

  // carrinho: { [itemId]: quantidade }
  const [carrinho, setCarrinho] = useState({});
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  const [toast, setToast] = useState(null);

  // ---------- carregamento de dados ----------

  async function carregarCardapio(silencioso = false) {
    if (!silencioso) setCarregandoCardapio(true);
    setErroCardapio(null);
    try {
      const dados = await buscarCardapio();
      setItens(dados);
    } catch (erro) {
      setErroCardapio("Não foi possível carregar o cardápio. O serviço pode estar fora do ar.");
    } finally {
      setCarregandoCardapio(false);
    }
  }

  async function carregarPedidosCliente(silencioso = false) {
    if (!cpfValido(cliente.cpf)) {
      setPedidosCliente([]);
      return;
    }
    if (!silencioso) setCarregandoPedidos(true);
    setErroPedidos(null);
    try {
      const dados = await buscarPedidos(somenteDigitos(cliente.cpf));
      setPedidosCliente(dados);
    } catch (erro) {
      setErroPedidos("Não foi possível carregar seus pedidos. O serviço pode estar fora do ar.");
    } finally {
      setCarregandoPedidos(false);
    }
  }

  async function carregarPedidosAdmin(silencioso = false) {
    if (!silencioso) setCarregandoPedidos(true);
    setErroPedidos(null);
    try {
      const dados = await buscarPedidos();
      setPedidosAdmin(dados);
    } catch (erro) {
      setErroPedidos("Não foi possível carregar os pedidos. O serviço pode estar fora do ar.");
    } finally {
      setCarregandoPedidos(false);
    }
  }

  // primeira carga do cardápio
  useEffect(() => {
    carregarCardapio();
  }, []);

  // ao entrar em cada aba, busca dados frescos (assim o cliente vê o que o admin mudou)
  useEffect(() => {
    if (abaAtiva === "cardapio" || abaAtiva === "admin-cardapio") {
      carregarCardapio(itens.length > 0);
    }
    if (abaAtiva === "historico") carregarPedidosCliente();
    if (abaAtiva === "admin-pedidos") carregarPedidosAdmin(pedidosAdmin.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAtiva, cliente.cpf]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_CLIENTE, JSON.stringify(cliente));
    } catch {
      // sem localStorage: só não lembra do cliente na próxima visita
    }
  }, [cliente]);

  // quando o CPF fica completo/válido na aba de pedido, verifica se esse
  // cliente já pediu antes e, se sim, preenche o nome automaticamente
  useEffect(() => {
    if (abaAtiva !== "pedido") return;
    if (!cpfValido(cliente.cpf)) return;

    const cpfDigitos = somenteDigitos(cliente.cpf);
    let cancelado = false;

    (async () => {
      try {
        const pedidosDoCliente = await buscarPedidos(cpfDigitos);
        if (cancelado || pedidosDoCliente.length === 0) return;
        // vem ordenado por dataPedido DESC: o [0] é o pedido mais recente
        const nomeConhecido = pedidosDoCliente[0].nomeCliente;
        setCliente((atual) =>
          atual.cpf === cpfDigitos && atual.nome !== nomeConhecido
            ? { ...atual, nome: nomeConhecido }
            : atual
        );
      } catch {
        // serviço de pedidos fora do ar: cliente digita o nome manualmente
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.cpf, abaAtiva]);

  function mostrarToast(texto, tipo = "sucesso") {
    setToast({ texto, tipo });
    setTimeout(() => setToast(null), 2400);
  }

  function mensagemDeErro(erro, padrao) {
    return erro.response?.data?.erro || padrao;
  }

  function trocarModo(novoModo) {
    if (novoModo === modo) return;
    setModo(novoModo);
    setAbaAtiva(novoModo === "admin" ? "admin-cardapio" : "inicio");
    setErroPedidos(null);
  }

  // ---------- cliente: carrinho e pedido ----------

  // adiciona `qtd` unidades de um item ao carrinho (soma se já existir),
  // nunca deixando o total no carrinho passar do estoque disponível
  function adicionarAoCarrinho(itemId, qtd) {
    const item = itens.find((i) => i.id === itemId);
    const limite = item ? item.estoque : Infinity;
    const qtdAtual = carrinho[itemId] || 0;
    const disponivel = limite - qtdAtual;

    if (disponivel <= 0) {
      mostrarToast("Não há mais estoque disponível para este item.", "erro");
      return;
    }

    const qtdParaAdicionar = Math.min(qtd, disponivel);
    setCarrinho((atual) => ({
      ...atual,
      [itemId]: (atual[itemId] || 0) + qtdParaAdicionar,
    }));
    mostrarToast(
      qtdParaAdicionar < qtd
        ? `apenas ${qtdParaAdicionar} unidade(s) adicionada(s): estoque no limite`
        : "item adicionado à fila"
    );
  }

  // também usada pelos botões +/- da aba de pedido: nunca deixa passar do
  // estoque atual do item, mesmo que o usuário clique + repetidamente
  function alterarQtdCarrinho(itemId, novaQtd) {
    const item = itens.find((i) => i.id === itemId);
    const limite = item ? item.estoque : Infinity;
    setCarrinho((atual) => ({
      ...atual,
      [itemId]: Math.min(limite, Math.max(0, novaQtd)),
    }));
  }

  function removerDoCarrinho(itemId) {
    setCarrinho((atual) => {
      const copia = { ...atual };
      delete copia[itemId];
      return copia;
    });
  }

  // monta as linhas do carrinho juntando id + quantidade com os dados reais do item
  const linhasCarrinho = Object.entries(carrinho)
    .filter(([, qtd]) => qtd > 0)
    .map(([itemId, qtd]) => ({
      item: itens.find((i) => i.id === itemId),
      qtd,
    }))
    .filter((linha) => linha.item); // descarta caso o item tenha sumido do cardápio

  const totalCarrinho = linhasCarrinho.reduce((s, l) => s + l.qtd, 0);

  // confirma o pedido: um POST /pedidos para cada linha da fila, em sequência.
  // Cada linha enviada com sucesso sai do carrinho, então se uma falhar no meio,
  // tentar de novo não duplica as que já foram.
  async function confirmarPedido() {
    setEnviandoPedido(true);
    try {
      for (const linha of linhasCarrinho) {
        await criarPedido({
          itemId: linha.item.id,
          quantidade: linha.qtd,
          nomeCliente: cliente.nome.trim(),
          cpf: somenteDigitos(cliente.cpf),
        });
        removerDoCarrinho(linha.item.id);
      }
      mostrarToast("pedido confirmado ✓");
      carregarCardapio(true); // atualiza estoque exibido
      setAbaAtiva("historico");
    } catch (erro) {
      mostrarToast(
        mensagemDeErro(erro, "Não foi possível concluir o pedido. Tente novamente em instantes."),
        "erro"
      );
      carregarCardapio(true);
    } finally {
      setEnviandoPedido(false);
    }
  }

  // "ver meus pedidos" sem ter feito pedido neste navegador
  function identificarPorCpf(cpf) {
    setCliente((atual) => ({ ...atual, cpf: somenteDigitos(cpf) }));
  }

  function trocarCliente() {
    setCliente({ nome: "", cpf: "" });
    setPedidosCliente([]);
  }

  // ---------- admin: cardápio ----------

  // devolve true se salvou (o formulário usa isso para limpar os campos)
  async function salvarItem(dados, id) {
    try {
      if (id) await atualizarItem(id, dados);
      else await criarItem(dados);
      mostrarToast(id ? "item atualizado ✓" : "item cadastrado ✓");
      await carregarCardapio(true);
      return true;
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro, "Não foi possível salvar o item."), "erro");
      return false;
    }
  }

  async function excluirItem(id) {
    try {
      await removerItem(id);
      removerDoCarrinho(id);
      mostrarToast("item removido ✓");
      await carregarCardapio(true);
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro, "Não foi possível remover o item."), "erro");
    }
  }

  async function ajustarEstoqueDoItem(id, delta) {
    try {
      const atualizado = await ajustarEstoque(id, delta);
      setItens((atual) => atual.map((i) => (i.id === id ? { ...i, estoque: atualizado.estoque } : i)));
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro, "Não foi possível ajustar o estoque."), "erro");
    }
  }

  // ---------- admin: pedidos ----------

  async function cancelarPedidoAdmin(id) {
    try {
      await cancelarPedido(id);
      mostrarToast("pedido cancelado ✓ estoque devolvido");
      await Promise.all([carregarPedidosAdmin(true), carregarCardapio(true)]);
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro, "Não foi possível cancelar o pedido."), "erro");
    }
  }

  const abas = modo === "admin" ? ABAS_ADMIN : ABAS_CLIENTE;

  return (
    <>
      <Header
        modo={modo}
        aoTrocarModo={trocarModo}
        totalCarrinho={totalCarrinho}
        aoAbrirPedido={() => setAbaAtiva("pedido")}
      />
      <TabsNav
        abas={abas}
        abaAtiva={abaAtiva}
        aoTrocarAba={setAbaAtiva}
        totalCarrinho={totalCarrinho}
      />

      <main>
        {abaAtiva === "inicio" && <TabInicio aoTrocarAba={setAbaAtiva} />}

        {abaAtiva === "cardapio" && (
          <TabCardapio
            itens={itens}
            carregando={carregandoCardapio}
            erro={erroCardapio}
            carrinho={carrinho}
            aoAdicionar={adicionarAoCarrinho}
          />
        )}

        {abaAtiva === "pedido" && (
          <TabPedido
            linhasCarrinho={linhasCarrinho}
            aoAlterarQtd={alterarQtdCarrinho}
            aoRemover={removerDoCarrinho}
            aoConfirmar={confirmarPedido}
            enviando={enviandoPedido}
            cliente={cliente}
            aoAlterarCliente={setCliente}
          />
        )}

        {abaAtiva === "historico" && (
          <TabHistorico
            pedidos={pedidosCliente}
            carregando={carregandoPedidos}
            erro={erroPedidos}
            cliente={cliente}
            aoIdentificar={identificarPorCpf}
            aoTrocarCliente={trocarCliente}
          />
        )}

        {abaAtiva === "admin-cardapio" && (
          <TabAdminCardapio
            itens={itens}
            carregando={carregandoCardapio}
            erro={erroCardapio}
            aoSalvar={salvarItem}
            aoExcluir={excluirItem}
            aoAjustarEstoque={ajustarEstoqueDoItem}
          />
        )}

        {abaAtiva === "admin-pedidos" && (
          <TabAdminPedidos
            pedidos={pedidosAdmin}
            carregando={carregandoPedidos}
            erro={erroPedidos}
            aoCancelar={cancelarPedidoAdmin}
          />
        )}
      </main>

      <footer>coffee.exe — arquitetura de microsserviços · DSW3</footer>

      <Toast mensagem={toast} />
    </>
  );
}
