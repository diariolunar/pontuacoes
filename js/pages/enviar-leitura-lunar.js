import {
  registrarLeituraLunar
} from "../services/pontuacoes.service.js";

import {
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

const leituraForm = document.getElementById("leituraForm");
const listaTexto = document.getElementById("listaTexto");
const membersList = document.getElementById("membersList");
const addMemberBtn = document.getElementById("addMemberBtn");
const lerListaBtn = document.getElementById("lerListaBtn");
const leituraMessage = document.getElementById("leituraMessage");
const submitBtn = leituraForm.querySelector('button[type="submit"]');

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
      value="${escaparHtml(membro.nome || "")}"
    />

    <input 
      type="text" 
      class="member-user" 
      placeholder="@user" 
      required 
      value="${escaparHtml(membro.user || "")}"
    />

    <input 
      type="number" 
      class="member-points" 
      value="50"
      readonly
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

      return {
        nome,
        user
      };
    })
    .filter((membro) => membro.nome && membro.user);
}

function lerFormatoNomeUser(texto) {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const membros = [];
  let nomeAtual = "";

  for (const linha of linhas) {
    const linhaNormalizada = normalizarTexto(linha);

    if (linhaNormalizada.startsWith("nome:")) {
      nomeAtual = extrairValor(linha);
      continue;
    }

    if (linhaNormalizada.startsWith("user:")) {
      const user = extrairValor(linha);

      if (nomeAtual && user) {
        membros.push({
          nome: nomeAtual,
          user: normalizarUser(user)
        });

        nomeAtual = "";
      }
    }
  }

  return membros;
}

function lerFormatoLinhaSimples(texto) {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const membros = [];

  for (const linha of linhas) {
    const linhaNormalizada = normalizarTexto(linha);

    if (
      linhaNormalizada.startsWith("nome:") ||
      linhaNormalizada.startsWith("user:") ||
      linhaNormalizada.includes("leitura lunar") ||
      linhaNormalizada.includes("chuva de estrelas")
    ) {
      continue;
    }

    let partes = [];

    if (linha.includes(" - ")) {
      partes = linha.split(" - ");
    } else if (linha.includes(" — ")) {
      partes = linha.split(" — ");
    } else if (linha.includes("|")) {
      partes = linha.split("|");
    } else if (linha.includes(";")) {
      partes = linha.split(";");
    } else if (linha.includes(",")) {
      partes = linha.split(",");
    }

    partes = partes
      .map((parte) => parte.trim())
      .filter(Boolean);

    if (partes.length >= 2) {
      membros.push({
        nome: partes[0],
        user: normalizarUser(partes[1])
      });
    }
  }

  return membros;
}

function removerDuplicados(membros) {
  const mapa = new Map();

  for (const membro of membros) {
    const user = normalizarUser(membro.user);

    if (!mapa.has(user)) {
      mapa.set(user, {
        nome: membro.nome,
        user
      });
    }
  }

  return Array.from(mapa.values());
}

function lerListaCompleta(texto) {
  const porNomeUser = lerFormatoNomeUser(texto);
  const porLinhaSimples = lerFormatoLinhaSimples(texto);

  return removerDuplicados([
    ...porNomeUser,
    ...porLinhaSimples
  ]);
}

addMemberBtn.addEventListener("click", () => {
  criarLinhaMembro();
});

lerListaBtn.addEventListener("click", () => {
  const texto = listaTexto.value.trim();

  if (!texto) {
    mostrarMensagem(
      leituraMessage,
      "Cole a lista antes de tentar ler automaticamente.",
      "error"
    );

    return;
  }

  const membros = lerListaCompleta(texto);

  if (membros.length === 0) {
    mostrarMensagem(
      leituraMessage,
      "Não consegui encontrar membros. Use um formato como: Mayke Arrais - RKymae",
      "error"
    );

    return;
  }

  membersList.innerHTML = "";

  membros.forEach((membro) => {
    criarLinhaMembro(membro);
  });

  mostrarMensagem(
    leituraMessage,
    `${membros.length} membro(s) encontrado(s). Cada um receberá 50 pontos.`,
    "success"
  );
});

leituraForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const membros = coletarMembros();
  const semana = gerarSemanaAtual();

  if (membros.length === 0) {
    mostrarMensagem(
      leituraMessage,
      "Adicione pelo menos um membro antes de enviar.",
      "error"
    );

    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    mostrarMensagem(
      leituraMessage,
      "Enviando Leitura Lunar para o Firebase...",
      "success"
    );

    await registrarLeituraLunar({
      semana,
      membros
    });

    mostrarMensagem(
      leituraMessage,
      `Leitura Lunar enviada com sucesso! Semana registrada: ${semana}.`,
      "success"
    );

    leituraForm.reset();
    membersList.innerHTML = "";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      leituraMessage,
      `Erro ao enviar Leitura Lunar: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar Leitura Lunar";
  }
});