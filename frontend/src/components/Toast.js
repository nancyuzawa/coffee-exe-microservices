export default function Toast({ mensagem }) {
  if (!mensagem) {
    // continua no DOM (sem "show") para a transição de saída funcionar,
    // mas escondido, então retornamos um elemento vazio com a mesma classe base.
    return <div className="toast" id="toast"></div>;
  }

  return (
    <div className={`toast show ${mensagem.tipo === "erro" ? "erro" : ""}`}>
      {mensagem.texto}
    </div>
  );
}
