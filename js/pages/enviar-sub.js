import {
  registrarPontuacaoSub
} from "../services/pontuacoes.service.js";

import {
  converterPontuacao,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

const subForm = document.getElementById("subForm");
const membersList = document.getElementById("membersList");
const addMemberBtn = document.getElementById("addMemberBtn");
const lerFichaBtn = document.getElementById("lerFichaBtn");
const subMessage = document.getElementById("subMessage");

function limparTextoEspecial(texto) {
  return texto
    .replace(/[𝐀-𝐙𝐚-𝐳𝟎-𝟗]/g, (char) => char)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extrairValor(linha) {
  const partes = linha.split(":");

  if (partes.length < 2) return "";

  return partes.slice(1).join(":").trim();
}

function criarLinhaMembro(membro = {}) {
  const linha = document.createElement("div");

  linha.className = "member-row";

  linha.innerHTML = `
    <input 
      type="text" 
      class="member-name" 
      placeholder="Nome do membro" 
      required 
      value="${membro.nome || ""}"
    />

    <input 
      type="text" 
      class="member-user" 
      placeholder="@user" 
      required 
      value="${membro.user || ""}"
    />

    <input 
      type="number" 
      class="member-points" 
      placeholder="Pontos" 
      required 
      min="0" 
      value="${membro.pontos ?? ""}"
    />

    <button type="button" class="remove-member">×</button>
  `;

  const removeBtn = linha.querySelector(".remove-member");

  removeBtn.addEventListener("click", () => {
    linha.remove();
  });

  membersList.appendChild(linha);
}

function coletarMembros() {
  const linhas = document.querySelectorAll(".member-row");

  return Array.from(linhas)
    .map((linha) => {
      const nome = linha.querySelector(".member-name").value.trim();
      const user = normalizarUser(linha.querySelector(".member-user").value);
      const pontos = converterPontuacao(linha.querySelector(".member-points").value);

      return {
        nome,
        user,
        pontos
      };
    })
    .filter((membro) => {
      return membro.nome && membro.user;
    });
}

function separarBlocosDeMembros(texto) {
  const linhas = texto.split(/\r?\n/);
  const blocos = [];
  let blocoAtual = [];

  for (const linhaOriginal of linhas) {
    const linha = linhaOriginal.trim();

    if (linha.includes("𝐍𝐨𝐦𝐞:") || linha.toLowerCase().includes("nome:")) {
      if (blocoAtual.length > 0) {
        blocos.push(blocoAtual.join("\n"));
      }

      blocoAtual = [linhaOriginal];
      continue;
    }

    if (blocoAtual.length > 0) {
      blocoAtual.push(linhaOriginal);
    }
  }

  if (blocoAtual.length > 0) {
    blocos.push(blocoAtual.join("\n"));
  }

  return blocos;
}

function extrairMembroDoBloco(bloco) {
  const linhas = bloco.split(/\r?\n/);

  let nome = "";
  let user = "";
  let pontos = 0;

  for (const linhaOriginal of linhas) {
    const linha = linhaOriginal.trim();

    if (linha.includes("𝐍𝐨𝐦𝐞:") || linha.toLowerCase().includes("nome:")) {
      nome = extrairValor(linha);
    }

    if (linha.includes("𝐔𝐬𝐞𝐫:") || linha.toLowerCase().includes("user:")) {
      user = normalizarUser(extrairValor(linha));
    }

    if (linha.includes("𝐏𝐨𝐧𝐭𝐨𝐬:") || linha.toLowerCase().includes("pontos:")) {
      pontos = converterPontuacao(extrairValor(linha));
    }
  }

  if (!nome || !user) {
    return null;
  }

  return {
    nome,
    user,
    pontos
  };
}

function lerFichaCompleta(texto) {
  const blocos = separarBlocosDeMembros(texto);

  return blocos
    .map((bloco) => extrairMembroDoBloco(bloco))
    .filter(Boolean);
}

addMemberBtn.addEventListener("click", () => {
  criarLinhaMembro();
});

lerFichaBtn.addEventListener("click", () => {
  const fichaTexto = document.getElementById("fichaTexto").value.trim();

  if (!fichaTexto) {
    mostrarMensagem(
      subMessage,
      "Cole a ficha completa antes de tentar ler automaticamente.",
      "error"
    );

    return;
  }

  const membros = lerFichaCompleta(fichaTexto);

  if (membros.length === 0) {
    mostrarMensagem(
      subMessage,
      "Não consegui encontrar membros na ficha. Confira se ela possui Nome, User e Pontos.",
      "error"
    );

    return;
  }

  membersList.innerHTML = "";

  membros.forEach((membro) => {
    criarLinhaMembro(membro);
  });

  mostrarMensagem(
    subMessage,
    `${membros.length} membro(s) encontrado(s). Confira os dados antes de enviar.`,
    "success"
  );
});

subForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const sub = document.getElementById("subNome").value;
  const codigoAdm = document.getElementById("codigoAdm").value.trim();
  const semana = document.getElementById("semana").value.trim();
  const membros = coletarMembros();

  if (membros.length === 0) {
    mostrarMensagem(
      subMessage,
      "Adicione pelo menos um membro com nome, user e pontuação.",
      "error"
    );

    return;
  }

  try {
    await registrarPontuacaoSub({
      sub,
      codigoAdm,
      semana,
      membros
    });

    mostrarMensagem(
      subMessage,
      "Pontuação enviada com sucesso!",
      "success"
    );

    subForm.reset();
    membersList.innerHTML = "";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      subMessage,
      "Erro ao enviar pontuação. Tente novamente.",
      "error"
    );
  }
});
