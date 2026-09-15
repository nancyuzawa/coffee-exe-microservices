import { useEffect, useState } from "react";
import Header from "./components/Header";
import TabsNav from "./components/TabsNav";
import TabInicio from "./components/TabInicio";
import TabCardapio from "./components/TabCardapio";
import TabPedido from "./components/TabPedido";
import TabHistorico from "./components/TabHistorico";
import Toast from "./components/Toast";
import { buscarCardapio } from "./api/cardapioApi";
import { buscarPedidos, criarPedido } from "./api/pedidosApi";
import "./App.css";

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState("inicio");

  const [itens, setItens] = useState([]);
  const [carregandoCardapio, setCarregandoCardapio] = useState(true);
  const [erroCardapio, setErroCardapio] = useState(null);

  const [pedidos, setPedidos] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [erroPedidos, setErroPedidos] = useState(null);

  // carrinho: { [itemId]: quantidade }
  const [carrinho, setCarrinho] = useState({});
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  const [toast, setToast] = useState(null);

  async function carregarCardapio() {
    setCarregandoCardapio(true);
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

  async function carregarPedidos() {
    setCarregandoPedidos(true);
    setErroPedidos(null);
    try {
      const dados = await buscarPedidos();
      setPedidos(dados);
    } catch (erro) {
      setErroPedidos("Não foi possível carregar o histórico de pedidos.");
    } finally {
      setCarregandoPedidos(false);
    }
  }

  useEffect(() => {
    carregarCardapio();
    carregarPedidos();
  }, []);

  function mostrarToast(texto, tipo = "sucesso") {
    setToast({ texto, tipo });
    setTimeout(() => setToast(null), 2400);
  }

  // adiciona `qtd` unidades de um item ao carrinho (soma se já existir)
  function adicionarAoCarrinho(itemId, qtd) {
    setCarrinho((atual) => ({
      ...atual,
      [itemId]: (atual[itemId] || 0) + qtd,
    }));
    mostrarToast("item adicionado à fila");
  }

  function alterarQtdCarrinho(itemId, novaQtd) {
    setCarrinho((atual) => ({
      ...atual,
      [itemId]: Math.max(0, novaQtd),
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

  // confirma o pedido: um POST /pedidos para cada linha da fila, em sequência
  async function confirmarPedido() {
    setEnviandoPedido(true);
    try {
      for (const linha of linhasCarrinho) {
        await criarPedido(linha.item.id, linha.qtd);
      }
      mostrarToast("pedido confirmado ✓");
      setCarrinho({});
      carregarPedidos();
      carregarCardapio(); // atualiza estoque exibido
      setAbaAtiva("historico");
    } catch (erro) {
      const texto =
        erro.response?.data?.erro ||
        "Não foi possível concluir o pedido. Tente novamente em instantes.";
      mostrarToast(texto, "erro");
    } finally {
      setEnviandoPedido(false);
    }
  }

  return (
    <>
      <Header totalCarrinho={totalCarrinho} aoAbrirPedido={() => setAbaAtiva("pedido")} />
      <TabsNav abaAtiva={abaAtiva} aoTrocarAba={setAbaAtiva} totalCarrinho={totalCarrinho} />

      <main>
        {abaAtiva === "inicio" && <TabInicio aoTrocarAba={setAbaAtiva} />}

        {abaAtiva === "cardapio" && (
          <TabCardapio
            itens={itens}
            carregando={carregandoCardapio}
            erro={erroCardapio}
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
          />
        )}

        {abaAtiva === "historico" && (
          <TabHistorico pedidos={pedidos} carregando={carregandoPedidos} erro={erroPedidos} />
        )}
      </main>

      <footer>coffee.exe — arquitetura de microsserviços · DSW3</footer>

      <Toast mensagem={toast} />
    </>
  );
}
