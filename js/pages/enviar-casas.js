import {
  registrarPontuacaoVariavel
} from "../services/pontuacoes.service.js";

import {
  confirmarModal,
  converterPontuacao,
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

const casasForm = document.getElementById("casasForm");
const listaCasasTexto = document.getElementById("listaCasasTexto");
const lerListaCasasBtn = document.getElementById("lerListaCasasBtn");
const membrosCasasLista = document.getElementById("membrosCasasLista");
const casasMessage = document.getElementById("casasMessage");
const submitBtn = casasForm.querySelector('button[type="submit"]');

let membrosPreparados = [];

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function linhaTemCampo(linha, campo) {
  const linhaNormalizada = normalizarTexto(linha);
  const regex = new RegExp(`^${campo}\\s*\\.?\\s*:`, "i");

  return regex.test(linhaNormalizada);
}

function extrairValor(linha) {
  const partes = String(linha || "").split(":");

  if (partes.length < 2) {
    return "";
  }

  return partes.slice(1).join(":").trim();
}

function fecharBloco(lista, bloco) {
  if (!bloco.nome || !bloco.user || bloco.pontos <= 0) {
    return;
  }

  lista.push({
    nome: bloco.nome.trim(),
    user: normalizarUser(bloco.user),
    pontos: Number(bloco.pontos || 0),
    descricao: bloco.motivo || ""
  });
}

function lerListaCasas(texto) {
  const linhas = String(texto || "")
    .split(/\r?\n/)
    .map((linha) => linha.trim());

  const membros = [];

  let atual = {
    nome: "",
    user: "",
    pontos: 0,
    motivo: ""
  };

  for (const linha of linhas) {
    if (!linha) {
      continue;
    }

    if (linhaTemCampo(linha, "nome")) {
      if (atual.nome || atual.user || atual.pontos || atual.motivo) {
        fecharBloco(membros, atual);
      }

      atual = {
        nome: extrairValor(linha),
        user: "",
        pontos: 0,
        motivo: ""
      };

      continue;
    }

    if (linhaTemCampo(linha, "user")) {
      atual.user = extrairValor(linha);
      continue;
    }

    if (linhaTemCampo(linha, "pontos")) {
      atual.pontos = Math.abs(converterPontuacao(extrairValor(linha)));
      continue;
    }

    if (linhaTemCampo(linha, "motivo")) {
      atual.motivo = extrairValor(linha);
      continue;
    }

    if (atual.motivo) {
      atual.motivo = `${atual.motivo} ${linha}`.trim();
    }
  }

  fecharBloco(membros, atual);

  return membros;
}

function criarCardMembro(membro, index) {
  return `
    <article class="member-admin-card member-list-card casas-card" data-index="${index}">
      <div class="member-admin-header">
        <div>
          <h2>${escaparHtml(membro.nome || "Sem nome")}</h2>
          <p>${escaparHtml(normalizarUser(membro.user || ""))}</p>
        </div>
      </div>

      <div class="member-edit-form member-list-form">
        <div class="field">
          <label>Pontos</label>
          <input type="number" class="casas-pontos" min="1" value="${Number(membro.pontos || 0)}" />
        </div>

        <div class="field">
          <label>Motivo</label>
          <textarea class="casas-motivo">${escaparHtml(membro.descricao || "")}</textarea>
        </div>

        <div class="member-admin-actions">
          <button type="button" class="btn danger remover-membro-casas-btn">
            Remover
          </button>
        </div>
      </div>
    </article>
  `;
}

function sincronizarComTela() {
  const cards = document.querySelectorAll(".casas-card");

  cards.forEach((card) => {
    const index = Number(card.dataset.index);
    const pontos = Number(card.querySelector(".casas-pontos").value || 0);
    const motivo = card.querySelector(".casas-motivo").value.trim();

    if (membrosPreparados[index]) {
      membrosPreparados[index].pontos = pontos;
      membrosPreparados[index].descricao = motivo;
    }
  });
}

function renderizarMembros() {
  if (membrosPreparados.length === 0) {
    membrosCasasLista.innerHTML = `
      <div class="list-item">
        Nenhum membro lido ainda.
      </div>
    `;

    return;
  }

  membrosCasasLista.innerHTML = membrosPreparados
    .map((membro, index) => criarCardMembro(membro, index))
    .join("");

  document.querySelectorAll(".remover-membro-casas-btn").forEach((botao) => {
    botao.addEventListener("click", () => {
      const card = botao.closest(".casas-card");
      const index = Number(card.dataset.index);

      membrosPreparados.splice(index, 1);
      renderizarMembros();
    });
  });
}

lerListaCasasBtn.addEventListener("click", () => {
  const texto = listaCasasTexto.value.trim();

  if (!texto) {
    mostrarMensagem(
      casasMessage,
      "Cole a lista das casas antes de tentar ler automaticamente.",
      "error"
    );

    return;
  }

  const membros = lerListaCasas(texto);

  if (membros.length === 0) {
    membrosPreparados = [];
    renderizarMembros();

    mostrarMensagem(
      casasMessage,
      "Não consegui encontrar membros válidos. Confira se a lista possui Nome, User, Pontos e Motivo.",
      "error"
    );

    return;
  }

  membrosPreparados = membros;
  renderizarMembros();

  casasMessage.textContent = "";
  casasMessage.className = "message";
});

casasForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  sincronizarComTela();

  const membrosValidos = membrosPreparados.filter((membro) => {
    return membro.nome && membro.user && Number(membro.pontos || 0) > 0;
  });

  if (membrosValidos.length === 0) {
    mostrarMensagem(
      casasMessage,
      "Nenhum membro válido preparado para envio.",
      "error"
    );

    return;
  }

  const confirmar = await confirmarModal({
    titulo: "Confirmar pontos das Casas",
    texto: `Tem certeza que deseja enviar pontos das Casas para ${membrosValidos.length} membro(s)?`,
    tipo: "warning",
    textoConfirmar: "Enviar pontos",
    textoCancelar: "Cancelar"
  });

  if (!confirmar) {
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    await registrarPontuacaoVariavel({
      semana: gerarSemanaAtual(),
      membros: membrosValidos,
      categoria: "casas",
      colecao: "casas",
      origem: "Casas"
    });

    mostrarMensagem(
      casasMessage,
      "Pontos das Casas enviados com sucesso.",
      "success"
    );

    casasForm.reset();
    membrosPreparados = [];
    renderizarMembros();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      casasMessage,
      `Erro ao enviar pontos das Casas: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar pontos das Casas";
  }
});

renderizarMembros();