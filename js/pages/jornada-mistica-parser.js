import {
  converterPontuacao,
  normalizarUser
} from "../core/utils.js";

function normalizarLinha(linha) {
  return String(linha || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^[^a-z]+/, "")
    .trim();
}

function extrairValor(linha) {
  const indice = String(linha || "").indexOf(":");

  return indice === -1 ? "" : String(linha).slice(indice + 1).trim();
}

function criarDescricao({ obras, feedback, resultado }) {
  return [
    obras && `Obras lidas: ${obras}`,
    feedback && `Feedback: ${feedback}`,
    resultado && `Resultado: ${resultado}`
  ].filter(Boolean).join(" | ");
}

export function lerListaJornadaMistica(texto) {
  const membros = [];
  let atual = {};

  function fecharMembro() {
    if (atual.nome && atual.user) {
      membros.push({
        nome: atual.nome,
        user: normalizarUser(atual.user),
        pontos: atual.pontos || 0,
        descricao: criarDescricao(atual)
      });
    }

    atual = {};
  }

  for (const linhaOriginal of String(texto || "").split(/\r?\n/)) {
    const linha = normalizarLinha(linhaOriginal);

    if (!linha) {
      continue;
    }

    if (/^nome\s*\.?\s*:/.test(linha)) {
      if (atual.nome || atual.user || atual.pontos) {
        fecharMembro();
      }

      atual.nome = extrairValor(linhaOriginal);
      continue;
    }

    if (/^user\s*\.?\s*:/.test(linha)) {
      atual.user = extrairValor(linhaOriginal);
      continue;
    }

    if (/^obras\s+lidas?(?:\s*\.?(?:\s*\(\d+\))?)?\s*:/.test(linha)) {
      atual.obras = extrairValor(linhaOriginal);
      continue;
    }

    if (/^feedback\s*\.?\s*:/.test(linha)) {
      atual.feedback = extrairValor(linhaOriginal);
      continue;
    }

    if (/^resultado\s*\.?\s*:/.test(linha)) {
      atual.resultado = extrairValor(linhaOriginal);
      continue;
    }

    if (/^pontos?\s*\.?\s*:/.test(linha)) {
      atual.pontos = Math.abs(converterPontuacao(extrairValor(linhaOriginal)));
    }
  }

  fecharMembro();

  return membros.filter((membro) => membro.pontos > 0);
}
