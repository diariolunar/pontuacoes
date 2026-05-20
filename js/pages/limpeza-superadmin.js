import {
  auth
} from "../config/firebase.js";

import {
  configurarBotaoLogout,
  configurarMenuPorPermissao,
  protegerPagina
} from "../core/auth.js";

import {
  escaparHtml,
  mostrarMensagem,
  normalizarBusca
} from "../core/utils.js";

import {
  excluirRegistroDeMovimentacao,
  listarRegistrosDeMovimentacao
} from "../services/limpeza.service.js";

protegerPagina();
configurarBotaoLogout();

const SUPERADMIN_UID = "TYd7SwJ3PeUdxZvdaNLnoxaTjDd2";

const buscaRegistro = document.getElementById("buscaRegistro");
const limparBuscaBtn = document.getElementById("limparBuscaBtn");
const filtroColecao = document.getElementById("filtroColecao");
const recarregarBtn = document.getElementById("recarregarBtn");
const totalRegistrosTexto = document.getElementById("totalRegistrosTexto");
const registrosLista = document.getElementById("registrosLista");
const limpezaMessage = document.getElementById("limpezaMessage");

let registrosCarregados = [];

function usuarioAtualEhSuperadmin() {
  return auth.currentUser?.uid === SUPERADMIN_UID;
}

function aguardarLogin() {
  return new Promise((resolve) => {
    const cancelarObservador = auth.onAuthStateChanged((usuario) => {
      cancelarObservador();
      resolve(usuario);
    });
  });
}

function formatarData(valor) {
  if (!valor) {
    return "Sem data";
  }

  let data = null;

  if (typeof valor.toDate === "function") {
    data = valor.toDate();
  } else if (valor.seconds) {
    data = new Date(valor.seconds * 1000);
  }

  if (!data) {
    return "Sem data";
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatarPontos(pontos) {
  const numero = Number(pontos || 0);

  if (numero > 0) {
    return `+${numero}`;
  }

  return String(numero);
}

function formatarCategoria(categoria) {
  const mapa = {
    subs: "Subs",
    leituraLunar: "Leitura Lunar",
    chuvaEstrelas: "Chuva de Estrelas",
    adms: "Pontuação dos ADMs",
    diarioLunar: "Diário Lunar",
    ascensao: "Ascensão",
    redesSociais: "Redes Sociais",
    divulgacoes: "Divulgações",
    ajustes: "Ajustes Manuais"
  };

  return mapa[categoria] || categoria || "Sem categoria";
}

function criarTextoBusca(registro) {
  return normalizarBusca([
    registro.tipo,
    registro.colecao,
    registro.nome,
    registro.user,
    registro.categoria,
    registro.pontos,
    registro.origem,
    registro.motivo,
    registro.semana,
    formatarData(registro.criadoEm)
  ].join(" "));
}

function obterRegistrosFiltrados() {
  const termo = normalizarBusca(buscaRegistro.value || "");
  const colecaoSelecionada = filtroColecao.value;

  return registrosCarregados.filter((registro) => {
    const passaColecao =
      colecaoSelecionada === "todos" ||
      registro.colecao === colecaoSelecionada;

    if (!passaColecao) {
      return false;
    }

    if (!termo) {
      return true;
    }

    return criarTextoBusca(registro).includes(termo);
  });
}

function criarCardRegistro(registro) {
  const detalhe = registro.motivo || registro.origem || "Sem motivo/origem registrada";

  return `
    <article
      class="member-admin-card member-list-card movement-card"
      data-id="${escaparHtml(registro.id)}"
      data-colecao="${escaparHtml(registro.colecao)}"
    >
      <div class="member-admin-header">
        <div>
          <h2>${escaparHtml(registro.nome || "Sem nome")}</h2>
          <p>${escaparHtml(registro.user || "Sem user")}</p>
        </div>
      </div>

      <div class="point-card-content">
        <div class="point-breakdown">
          <span>Tipo: ${escaparHtml(registro.tipo)}</span>
          <span>Coleção: ${escaparHtml(registro.colecao)}</span>
          <span>Categoria: ${escaparHtml(formatarCategoria(registro.categoria))}</span>
          <span>Pontos: ${escaparHtml(formatarPontos(registro.pontos))}</span>
          <span>Semana: ${escaparHtml(registro.semana || "Sem semana")}</span>
          <span>Data: ${escaparHtml(formatarData(registro.criadoEm))}</span>
          <span>${escaparHtml(detalhe)}</span>
        </div>

        <button type="button" class="btn danger delete-movement-btn">
          Apagar este registro
        </button>
      </div>
    </article>
  `;
}

function renderizarRegistros() {
  const registros = obterRegistrosFiltrados();

  totalRegistrosTexto.textContent = `Registros encontrados: ${registros.length}`;

  if (registros.length === 0) {
    registrosLista.innerHTML = `
      <div class="list-item">
        Nenhum registro encontrado com os filtros atuais.
      </div>
    `;

    return;
  }

  registrosLista.innerHTML = registros
    .map((registro) => criarCardRegistro(registro))
    .join("");

  configurarBotoesExcluir();
}

function removerRegistroDaLista({
  colecao,
  id
}) {
  registrosCarregados = registrosCarregados.filter((registro) => {
    return !(registro.colecao === colecao && registro.id === id);
  });
}

function configurarBotoesExcluir() {
  const botoes = document.querySelectorAll(".delete-movement-btn");

  botoes.forEach((botao) => {
    botao.addEventListener("click", async () => {
      const card = botao.closest(".movement-card");
      const id = card.dataset.id;
      const colecao = card.dataset.colecao;

      const nome = card.querySelector("h2")?.textContent || "este registro";

      const confirmar = window.confirm(
        `Tem certeza que deseja apagar ${nome}?\n\nIsso remove apenas este registro de movimentação.\nA Pontuação Geral NÃO será alterada.`
      );

      if (!confirmar) {
        return;
      }

      try {
        botao.disabled = true;
        botao.textContent = "Apagando...";

        await excluirRegistroDeMovimentacao({
          colecao,
          id
        });

        removerRegistroDaLista({
          colecao,
          id
        });

        mostrarMensagem(
          limpezaMessage,
          "Registro apagado com sucesso. A Pontuação Geral não foi alterada.",
          "success"
        );

        renderizarRegistros();
      } catch (erro) {
        console.error(erro);

        mostrarMensagem(
          limpezaMessage,
          `Erro ao apagar registro: ${erro.message || "tente novamente."}`,
          "error"
        );
      } finally {
        botao.disabled = false;
        botao.textContent = "Apagar este registro";
      }
    });
  });
}

async function carregarRegistros() {
  if (!usuarioAtualEhSuperadmin()) {
    registrosLista.innerHTML = "";

    mostrarMensagem(
      limpezaMessage,
      "Acesso negado. Esta página só pode ser usada pelo superadmin.",
      "error"
    );

    return;
  }

  try {
    recarregarBtn.disabled = true;
    recarregarBtn.textContent = "Carregando...";

    registrosCarregados = await listarRegistrosDeMovimentacao();

    renderizarRegistros();

    mostrarMensagem(
      limpezaMessage,
      "Registros carregados. Apagar aqui não altera a Pontuação Geral.",
      "success"
    );
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      limpezaMessage,
      `Erro ao carregar registros: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    recarregarBtn.disabled = false;
    recarregarBtn.textContent = "Recarregar registros";
  }
}

async function iniciarPagina() {
  await configurarMenuPorPermissao();

  const usuario = await aguardarLogin();

  if (!usuario || !usuarioAtualEhSuperadmin()) {
    registrosLista.innerHTML = "";

    buscaRegistro.disabled = true;
    filtroColecao.disabled = true;
    limparBuscaBtn.disabled = true;
    recarregarBtn.disabled = true;

    mostrarMensagem(
      limpezaMessage,
      "Acesso negado. Entre com o usuário superadmin para usar esta página.",
      "error"
    );

    return;
  }

  await carregarRegistros();
}

buscaRegistro.addEventListener("input", () => {
  renderizarRegistros();
});

filtroColecao.addEventListener("change", () => {
  renderizarRegistros();
});

limparBuscaBtn.addEventListener("click", () => {
  buscaRegistro.value = "";
  filtroColecao.value = "todos";
  renderizarRegistros();
});

recarregarBtn.addEventListener("click", () => {
  carregarRegistros();
});

iniciarPagina();
