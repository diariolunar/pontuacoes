import {
  atualizarMembro,
  cadastrarMembro,
  excluirMembro,
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

const novoMembroForm = document.getElementById("novoMembroForm");
const novoNome = document.getElementById("novoNome");
const novoUser = document.getElementById("novoUser");

const buscaMembro = document.getElementById("buscaMembro");
const limparBuscaBtn = document.getElementById("limparBuscaBtn");
const membrosLista = document.getElementById("membrosLista");
const membrosMessage = document.getElementById("membrosMessage");
const totalMembrosTexto = document.getElementById("totalMembrosTexto");

let membrosCarregados = [];

function criarCardMembro(membro) {
  return `
    <article class="member-admin-card member-list-card" data-member-id="${escaparHtml(membro.id)}">
      <div class="member-admin-header">
        <div>
          <h2>${escaparHtml(membro.nome || "Sem nome")}</h2>
          <p>${escaparHtml(membro.user || "Sem user")}</p>
        </div>
      </div>

      <form class="member-edit-form member-list-form">
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

        <div class="member-admin-actions">
          <button type="submit" class="btn primary">
            Salvar
          </button>

          <button type="button" class="btn danger delete-member-btn">
            Excluir
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
  configurarBotoesExcluir();
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

  return {
    idAtual,
    nome,
    user
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

function removerMembroDaLista(id) {
  membrosCarregados = membrosCarregados.filter((membro) => membro.id !== id);
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
        botao.textContent = "Salvar";
      }
    });
  });
}

function configurarBotoesExcluir() {
  const botoes = document.querySelectorAll(".delete-member-btn");

  botoes.forEach((botao) => {
    botao.addEventListener("click", async () => {
      const card = botao.closest(".member-admin-card");
      const id = card.dataset.memberId;
      const nome = card.querySelector(".edit-nome").value.trim();
      const user = card.querySelector(".edit-user").value.trim();

      const confirmar = window.confirm(
        `Tem certeza que deseja excluir o cadastro de ${nome} (${user})?\n\nIsso não apaga o histórico de pontuação já registrado.`
      );

      if (!confirmar) {
        return;
      }

      try {
        botao.disabled = true;
        botao.textContent = "Excluindo...";

        await excluirMembro(id);

        removerMembroDaLista(id);

        mostrarMensagem(
          membrosMessage,
          "Membro excluído com sucesso.",
          "success"
        );

        filtrarMembros();
      } catch (erro) {
        console.error(erro);

        mostrarMensagem(
          membrosMessage,
          `Erro ao excluir membro: ${erro.message || "tente novamente."}`,
          "error"
        );
      } finally {
        botao.disabled = false;
        botao.textContent = "Excluir";
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

novoMembroForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nome = novoNome.value.trim();
  const user = novoUser.value.trim();
  const botao = novoMembroForm.querySelector('button[type="submit"]');

  if (!nome || !user) {
    mostrarMensagem(
      membrosMessage,
      "Preencha nome e user para cadastrar.",
      "error"
    );

    return;
  }

  try {
    botao.disabled = true;
    botao.textContent = "Cadastrando...";

    const novoMembro = await cadastrarMembro({
      nome,
      user
    });

    membrosCarregados.push(novoMembro);

    membrosCarregados.sort((a, b) => {
      const nomeA = String(a.nome || "").toLowerCase();
      const nomeB = String(b.nome || "").toLowerCase();

      return nomeA.localeCompare(nomeB);
    });

    novoMembroForm.reset();

    mostrarMensagem(
      membrosMessage,
      "Membro cadastrado com sucesso.",
      "success"
    );

    filtrarMembros();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      membrosMessage,
      `Erro ao cadastrar membro: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    botao.disabled = false;
    botao.textContent = "Cadastrar membro";
  }
});

buscaMembro.addEventListener("input", () => {
  filtrarMembros();
});

limparBuscaBtn.addEventListener("click", () => {
  buscaMembro.value = "";
  renderizarMembros(membrosCarregados);
});

carregarMembros();
