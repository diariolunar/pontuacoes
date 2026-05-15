export function normalizarUser(user) {
  if (!user) return "";

  const userLimpo = String(user).trim().toLowerCase();

  if (userLimpo.startsWith("@")) {
    return userLimpo;
  }

  return `@${userLimpo}`;
}

export function criarIdSeguro(valor) {
  return String(valor || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/@/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function converterPontuacao(valor) {
  if (valor === null || valor === undefined) {
    return 0;
  }

  const texto = String(valor)
    .normalize("NFKC")
    .replace(/[^\d,.\-]/g, "")
    .replace(",", ".")
    .trim();

  if (!texto || texto === "-") {
    return 0;
  }

  const numero = Number(texto);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
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

export function mostrarMensagem(elemento, texto, tipo = "success") {
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.className = `message ${tipo}`;
}

export function escaparHtml(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
