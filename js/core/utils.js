export function normalizarUser(user) {
  if (!user) return "";

  const userLimpo = user.trim().toLowerCase();

  if (userLimpo.startsWith("@")) {
    return userLimpo;
  }

  return `@${userLimpo}`;
}

export function converterPontuacao(valor) {
  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
}

export function criarIdSeguro(texto) {
  return texto
    .trim()
    .toLowerCase()
    .replaceAll("@", "")
    .replaceAll(".", "-")
    .replaceAll("/", "-")
    .replaceAll(" ", "-");
}

export function mostrarMensagem(elemento, texto, tipo = "success") {
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.className = `message ${tipo}`;
}
