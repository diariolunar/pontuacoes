import {
  registrarPontuacaoVariavel
} from "../services/pontuacoes.service.js";

import {
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

export function iniciarEnvioCategoriaVariavel({
  formId,
  listaTextoId,
  membersListId,
  addMemberBtnId,
  lerListaBtnId,
  messageId,
  categoria,
  colecao,
  origem,
  pontosLabel = "Pontos",
  descricaoLabel = "Motivo/atividade",
  submitText = "Enviar pontuação"
}) {
  const form = document.getElementById(formId);
  const listaTexto = document.getElementById(listaTextoId);
  const membersList = document.getElementById(membersListId);
  const addMemberBtn = document.getElementById(addMemberBtnId);
  const lerListaBtn = document.getElementById(lerListaBtnId);
  const message = document.getElementById(messageId);

  if (!form || !listaTexto || !membersList || !addMemberBtn || !lerListaBtn || !message) {
    console.error("Erro: elementos da página de envio não foram encontrados.", {
      formId,
      listaTextoId,
      membersListId,
      addMemberBtnId,
      lerListaBtnId,
      messageId
    });

    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');

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

    linha.className = "member-row variable-row";

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
        placeholder="${escaparHtml(pontosLabel)}" 
        required 
        value="${escaparHtml(membro.pontos || "")}"
      />

      <input 
        type="text" 
        class="member-description" 
        placeholder="${escaparHtml(descricaoLabel)}" 
        value="${escaparHtml(membro.descricao || "")}"
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
        const pontos = Number(linha.querySelector(".member-points").value || 0);
        const descricao = linha.querySelector(".member-description").value.trim();

        return {
          nome,
          user,
          pontos,
          descricao
        };
      })
      .filter((membro) => membro.nome && membro.user && membro.pontos > 0);
  }

  function lerFormatoBloco(texto) {
    const linhas = texto
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter(Boolean);

    const membros = [];
    let atual = {
      nome: "",
      user: "",
      pontos: "",
      descricao: ""
    };

    function fecharAtual() {
      if (atual.nome && atual.user && atual.pontos) {
        membros.push({
          nome: atual.nome,
          user: normalizarUser(atual.user),
          pontos: Number(atual.pontos || 0),
          descricao: atual.descricao || ""
        });
      }

      atual = {
        nome: "",
        user: "",
        pontos: "",
        descricao: ""
      };
    }

    for (const linha of linhas) {
      const linhaNormalizada = normalizarTexto(linha);

      if (linhaNormalizada.startsWith("nome:")) {
        if (atual.nome || atual.user || atual.pontos || atual.descricao) {
          fecharAtual();
        }

        atual.nome = extrairValor(linha);
        continue;
      }

      if (linhaNormalizada.startsWith("user:")) {
        atual.user = extrairValor(linha);
        continue;
      }

      if (
        linhaNormalizada.startsWith("pontos:") ||
        linhaNormalizada.startsWith("pontuacao:") ||
        linhaNormalizada.startsWith("pontuação:")
      ) {
        atual.pontos = extrairValor(linha);
        continue;
      }

      if (
        linhaNormalizada.startsWith("motivo:") ||
        linhaNormalizada.startsWith("atividade:") ||
        linhaNormalizada.startsWith("descricao:") ||
        linhaNormalizada.startsWith("descrição:") ||
        linhaNormalizada.startsWith("observacao:") ||
        linhaNormalizada.startsWith("observação:")
      ) {
        atual.descricao = extrairValor(linha);
      }
    }

    fecharAtual();

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
        linhaNormalizada.startsWith("pontos:") ||
        linhaNormalizada.startsWith("motivo:") ||
        linhaNormalizada.startsWith("atividade:")
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

      if (partes.length >= 3) {
        membros.push({
          nome: partes[0],
          user: normalizarUser(partes[1]),
          pontos: Number(partes[2] || 0),
          descricao: partes.slice(3).join(" - ")
        });
      }
    }

    return membros.filter((membro) => membro.pontos > 0);
  }

  function removerDuplicadosSomando(membros) {
    const mapa = new Map();

    for (const membro of membros) {
      const user = normalizarUser(membro.user);

      if (!mapa.has(user)) {
        mapa.set(user, {
          nome: membro.nome,
          user,
          pontos: Number(membro.pontos || 0),
          descricao: membro.descricao || ""
        });

        continue;
      }

      const existente = mapa.get(user);

      existente.pontos += Number(membro.pontos || 0);

      if (membro.descricao) {
        existente.descricao = existente.descricao
          ? `${existente.descricao}; ${membro.descricao}`
          : membro.descricao;
      }
    }

    return Array.from(mapa.values());
  }

  function lerListaCompleta(texto) {
    const porBloco = lerFormatoBloco(texto);
    const porLinha = lerFormatoLinhaSimples(texto);

    return removerDuplicadosSomando([
      ...porBloco,
      ...porLinha
    ]);
  }

  addMemberBtn.addEventListener("click", () => {
    criarLinhaMembro();
  });

  lerListaBtn.addEventListener("click", () => {
    const texto = listaTexto.value.trim();

    if (!texto) {
      mostrarMensagem(
        message,
        "Cole a lista antes de tentar ler automaticamente.",
        "error"
      );

      return;
    }

    const membros = lerListaCompleta(texto);

    if (membros.length === 0) {
      mostrarMensagem(
        message,
        "Não consegui encontrar membros. Use: Nome - User - Pontos - Motivo/atividade",
        "error"
      );

      return;
    }

    membersList.innerHTML = "";

    membros.forEach((membro) => {
      criarLinhaMembro(membro);
    });

    mostrarMensagem(
      message,
      `${membros.length} membro(s) encontrado(s). Confira os dados antes de enviar.`,
      "success"
    );
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const membros = coletarMembros();
    const semana = gerarSemanaAtual();

    if (membros.length === 0) {
      mostrarMensagem(
        message,
        "Adicione pelo menos um membro com nome, user e pontos antes de enviar.",
        "error"
      );

      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";

      mostrarMensagem(
        message,
        `Enviando ${origem} para o Firebase...`,
        "success"
      );

      await registrarPontuacaoVariavel({
        semana,
        membros,
        categoria,
        colecao,
        origem
      });

      mostrarMensagem(
        message,
        `${origem} enviada com sucesso! Semana registrada: ${semana}.`,
        "success"
      );

      form.reset();
      membersList.innerHTML = "";
    } catch (erro) {
      console.error(erro);

      mostrarMensagem(
        message,
        `Erro ao enviar ${origem}: ${erro.message || "tente novamente."}`,
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitText;
    }
  });
}