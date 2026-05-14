import {
  alterarStatusMembro,
  atualizarMembro,
  listarMembros
} from "../services/membros.service.js";

import {
  configurarBotaoLogout,
  configurarMenuPorPermissao,
  protegerPagina
} from "../core/auth.js";

import {
  escaparHtml,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

protegerPagina();
configurarBotaoLogout();

const buscaMembro = document.getElementById("buscaMembro");
const limparBuscaBtn = document.getElementById("limparBuscaBtn");
const membrosLista = document.getElementById("membrosLista");
const membrosMessage = document.getElementById("membrosMessage");
const totalMembrosTexto = document.getElementById("totalMembrosTexto");

let membrosCarregados = [];

const subsDisponiveis = [
  {
    valor: "A-1 Chama Eterna",
    texto: "A-1 - Chama Eterna"
  },
  {
    valor: "A-2 Página Livre",
    texto: "A-2 - Página Livre"
  },
  {
    valor: "A-3 Entre Nós",
    texto: "A-3 - Entre Nós"
  },
  {
    valor: "A-4 Sussurros da Aurora",
    texto: "A-4 - Sussurros da Aurora"
  },
  {
    valor: "A-5 Crepúsculo",
    texto: "A-5 - Crepúsculo"
  },
  {
    valor: "A-6 Trono Profano",
    texto: "A-6 - Trono Profano"
  },
  {
    valor: "A-8 Ordem do Eclipse",
    texto: "A-8 - Ordem do Eclipse"
  },
  {
    valor: "A-9 Cicatrizes Literárias",
    texto: "A-9 - Cicatrizes Literárias"
  },
  {
    valor: "A-10 Quasar",
    texto: "A-10 - Quasar"
  },
  {
    valor: "A-12 Estrela Polar",
    texto: "A-12 - Estrela Polar"
  },
  {
    valor: "A-13 Luar Profano",
    texto: "A-13 - Luar Profano"
  },
  {
    valor: "A-14 Fragmentos da Noite",
    texto: "A-14 - Fragmentos da Noite"
  },
  {
    valor: "A-15 Véu Escarlate",
    texto: "A-15 - Véu Escarlate"
  }
];

function criarOptionsSub(subAtual = "") {
  const primeiraOpcao = `<option value="">Sem sub definido</option>`;

  const opcoes = subsDisponiveis
    .map((sub) => {
      const selecionado = sub.valor === subAtual ? "selected" : "";

      return `
        <option value="${escaparHtml(sub.valor)}" ${selecionado}>
          ${escaparHtml(sub.texto)}
        </option>
      `;
    })
    .join("");

  return primeiraOpcao + opcoes;
}

function criarOptionsStatus(statusAtual = "ativo") {
  const statusSeguro = statusAtual || "ativo";

  return `
    <option value="ativo" ${statusSeguro === "ativo" ? "selected" : ""}>Ativo</option>
    <option value="inativo" ${statusSeguro === "inativo" ? "selected" : ""}>Inativo</option>
  `;
}

function criarCardMembro(membro) {
  const status = membro.status || "ativo";
  const statusClasse = status === "ativo" ? "success" : "muted";
  const statusTexto = status === "ativo" ? "Ativo" : "Inativo";

  return `
    <article class="member-admin-card" data-member-id="${escaparHtml(membro.id)}">
      <div class="member-admin-header">
        <div>
          <h2>${escaparHtml(membro.nome || "Sem nome")}</h2>
          <p>${escaparHtml(membro.user || "Sem user")}</p>
        </div>

        <span class="status-pill ${statusClasse}">
          ${statusTexto}
        </span>
      </div>

      <form class="member-edit-form">
        <div class="field">
          <label>Nome</label>
          <input
            type="text"
            class="edit-nome"
            value="${escaparHtml(membro.nome || "")}"
            required
          />
        </div>

        <div class="field">
          <label>User</label>
          <input
            type="text"
            class="edit-user"
            value="${escaparHtml(membro.user || "")}"
            required
          />
        </div>

        <div class="field">
          <label>Sub</label>
          <select class="edit-sub">
            ${criarOptionsSub(membro.sub || "")}
          </select>
        </div>

        <div class="field">
          <label>Status</label>
          <select class="edit-status">
            ${criarOptionsStatus(status)}
          </select>
        </div>

        <div class="member-admin-actions">
          <button type="submit" class="btn primary">
            Salvar alterações
          </button>

          <button type="button" class="btn secondary toggle-status-btn">
            ${status === "ativo" ? "Inativar" : "Ativar"}
          </button>
        </div>
      </form>
    </article>
  `;
}

function renderizarMembros(lista) {
  totalMembrosTexto.textContent = `Membros encontrados: ${lista.length}`;

  if (lista.length === 0) {
    membrosLista.innerHTML = "";

    mostrarMensagem(
      membrosMessage,
      "Nenhum membro encontrado.",
      "error"
    );

    return;
  }

  membrosMessage.textContent = "";
  membrosMessage.className = "message";

  membrosLista.innerHTML = lista
    .map((membro) => criarCardMembro(membro))
    .join("");

  configurarFormsDeEdicao();
  configurarBotoesStatus();
}

function filtrarMembros() {
  const termo = buscaMembro.value.trim().toLowerCase();

  if (!termo) {
    renderizarMembros(membrosCarregados);
    return;
  }

  const termoComoUser = normalizarUser(termo);

  const filtrados = membrosCarregados.filter((membro) => {
    const nome = String(membro.nome || "").toLowerCase();
    const user = normalizarUser(membro.user || "");

    return nome.includes(termo) || user.includes(termoComoUser);
  });

  renderizarMembros(filtrados);
}

function obterDadosDoCard(card) {
  const idAtual = card.dataset.memberId;
  const nome = card.querySelector(".edit-nome").value.trim();
  const user = card.querySelector(".edit-user").value.trim();
  const sub = card.querySelector(".edit-sub").value.trim();
  const status = card.querySelector(".edit-status").value;

  return {
    idAtual,
    nome,
    user,
    sub,
    status
  };
}

function atualizarMembroNaLista(idAntigo, membroAtualizado) {
  membrosCarregados = membrosCarregados.map((membro) => {
    if (membro.id !== idAntigo) {
      return membro;
    }

    return {
      ...membro,
      ...membroAtualizado
    };
  });
}

function configurarFormsDeEdicao() {
  const forms = document.querySelectorAll(".member-edit-form");

  forms.forEach((form) => {
    form.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const card = form.closest(".member-admin-card");
      const botao = form.querySelector('button[type="submit"]');
      const dados = obterDadosDoCard(card);

      if (!dados.nome || !dados.user) {
        mostrarMensagem(
          membrosMessage,
          "Nome e user são obrigatórios.",
          "error"
        );

        return;
      }

      try {
        botao.disabled = true;
        botao.textContent = "Salvando...";

        const membroAtualizado = await atualizarMembro(dados);

        atualizarMembroNaLista(dados.idAtual, membroAtualizado);

        mostrarMensagem(
          membrosMessage,
          "Membro atualizado com sucesso.",
          "success"
        );

        filtrarMembros();
      } catch (erro) {
        console.error(erro);

        mostrarMensagem(
          membrosMessage,
          `Erro ao atualizar membro: ${erro.message || "tente novamente."}`,
          "error"
        );
      } finally {
        botao.disabled = false;
        botao.textContent = "Salvar alterações";
      }
    });
  });
}

function configurarBotoesStatus() {
  const botoes = document.querySelectorAll(".toggle-status-btn");

  botoes.forEach((botao) => {
    botao.addEventListener("click", async () => {
      const card = botao.closest(".member-admin-card");
      const id = card.dataset.memberId;
      const selectStatus = card.querySelector(".edit-status");
      const statusAtual = selectStatus.value;
      const novoStatus = statusAtual === "ativo" ? "inativo" : "ativo";

      try {
        botao.disabled = true;
        botao.textContent = "Alterando...";

        await alterarStatusMembro({
          id,
          status: novoStatus
        });

        membrosCarregados = membrosCarregados.map((membro) => {
          if (membro.id !== id) return membro;

          return {
            ...membro,
            status: novoStatus
          };
        });

        mostrarMensagem(
          membrosMessage,
          `Membro ${novoStatus === "ativo" ? "ativado" : "inativado"} com sucesso.`,
          "success"
        );

        filtrarMembros();
      } catch (erro) {
        console.error(erro);

        mostrarMensagem(
          membrosMessage,
          `Erro ao alterar status: ${erro.message || "tente novamente."}`,
          "error"
        );
      } finally {
        botao.disabled = false;
      }
    });
  });
}

async function carregarMembros() {
  try {
    await configurarMenuPorPermissao();

    membrosCarregados = await listarMembros();

    renderizarMembros(membrosCarregados);
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      membrosMessage,
      "Erro ao carregar membros. Verifique o Firebase e tente novamente.",
      "error"
    );
  }
}

buscaMembro.addEventListener("input", () => {
  filtrarMembros();
});

limparBuscaBtn.addEventListener("click", () => {
  buscaMembro.value = "";
  renderizarMembros(membrosCarregados);
});

carregarMembros();
