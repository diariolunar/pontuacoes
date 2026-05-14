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
  return String(texto)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("@", "")
    .replaceAll(".", "-")
    .replaceAll("/", "-")
    .replaceAll(" ", "-")
    .replaceAll(":", "-")
    .replace(/[^\w-]/g, "");
}

export function mostrarMensagem(elemento, texto, tipo = "success") {
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.className = `message ${tipo}`;
}

export function gerarSemanaAtual() {
  const hoje = new Date();

  const inicio = new Date(hoje);
  const diaSemana = inicio.getDay();
  const diferencaParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;

  inicio.setDate(hoje.getDate() + diferencaParaSegunda);

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);

  const formatar = (data) => {
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return `${formatar(inicio)} a ${formatar(fim)}`;
}

export function escaparHtml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
