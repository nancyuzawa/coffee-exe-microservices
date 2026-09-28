// Utilitários de CPF (o CPF é a forma de identificar cada cliente nos pedidos).

// transforma o cpf com separações para apenas digito
export function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

// Confere tamanho, sequências repetidas (111.111.111-11) e os 2 dígitos verificadores.
export function cpfValido(valor) {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  const digitoVerificador = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(d[i]) * (tamanho + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digitoVerificador(9) === Number(d[9]) && digitoVerificador(10) === Number(d[10]);
}
