import {
  listarHistoricoPorUser,
  listarPontuacaoGeral
} from "../services/pontuacoes.service.js";

import {
  listarMembros
} from "../services/membros.service.js";

import {
  criarIdSeguro,
  escaparHtml,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

const buscaUser = document.getElementById("buscaUser");
const limparBuscaBtn = document.getElementById("limparBuscaBtn");
const pontuacoesLista = document.getElementById("pontuacoesLista");
const pontuacoesMessage = document.getElementById("pontuacoesMessage");
const modoPontuacaoTexto = document.getElementById("modoPontuacaoTexto");
const totalUsuariosTexto = document.getElementById("totalUsuariosTexto");
const movimentacoesModal = document.getElementById("movimentacoesModal");
const movimentacoesUser = document.getElementById("movimentacoesUser");
const movimentacoesConteudo = document.getElementById("movimentacoesConteudo");
const fecharMovimentacoesBtn = document.getElementById("fecharMovimentacoesBtn");

let pontuacoesCarregadas = [];
let membrosPorIdSeguro = new Map();

const categorias = [
  { campo: "total_subs", nome: "Subs" },
  { campo: "total_leituraLunar", nome: "Leitura Lunar" },
  { campo: "total_chuvaEstrelas", nome: "Chuva de Estrelas" },
  { campo: "total_adms", nome: "Pontuação dos ADMs" },
  { campo: "total_diarioLunar", nome: "Diário Lunar" },
  { campo: "total_jornadaMistica", nome: "Jornada Mística" },
  { campo: "total_ascensao", nome: "Ascensão" },
  { campo: "total_redesSociais", nome: "Redes Sociais" },
  { campo: "total_divulgacoes", nome: "Divulgações" },
  { campo: "total_casas", nome: "Casas" },
  { campo: "total_ajustes", nome: "Ajustes Manuais" },
  { campo: "total_lojaLunar", nome: "Loja Lunar" }
];

const nomesCategorias = Object.fromEntries(
  categorias.map((categoria) => [
    categoria.campo.replace(/^total_/, ""),
    categoria.nome
  ])
);

function obterNumero(valor) {
  const numero = Number(valor || 0);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
}

function arredondarNumero(valor) {
  const numero = obterNumero(valor);

  return Math.round((numero + Number.EPSILON) * 100) / 100;
}

function formatarTotalGeral(valor) {
  const arredondado = arredondarNumero(valor);

  if (Number.isInteger(arredondado)) {
    return String(arredondado);
  }

  return String(arredondado);
}

function formatarCategoria(categoria) {
  return nomesCategorias[categoria] || categoria || "Sem categoria";
}

function formatarPontos(valor) {
  const pontos = arredondarNumero(valor);

  return pontos > 0 ? `+${pontos}` : String(pontos);
}

function calcularTotalPorCategorias(pontuacao) {
  const total = categorias.reduce((soma, categoria) => {
    return soma + obterNumero(pontuacao[categoria.campo]);
  }, 0);

  const totalArredondado = arredondarNumero(total);

  return totalArredondado;
}

function criarMapaDeMembros(membros) {
  const mapa = new Map();

  for (const membro of membros) {
    const userIdSeguro = criarIdSeguro(membro.user || "");

    if (!userIdSeguro) {
      continue;
    }

    mapa.set(userIdSeguro, {
      id: membro.id,
      nome: membro.nome || "",
      user: normalizarUser(membro.user || "")
    });
  }

  return mapa;
}

function agruparPontuacoesPorUser(pontuacoes) {
  const mapa = new Map();

  for (const pontuacao of pontuacoes) {
    const userNormalizado = normalizarUser(pontuacao.user || "");
    const userIdSeguro = criarIdSeguro(userNormalizado);
    const membroOficial = membrosPorIdSeguro.get(userIdSeguro);

    if (!userIdSeguro || !membroOficial) {
      continue;
    }

    if (!mapa.has(userIdSeguro)) {
      const base = {
        ...pontuacao,
        nome: membroOficial.nome,
        user: membroOficial.user
      };

      for (const categoria of categorias) {
        base[categoria.campo] = obterNumero(base[categoria.campo]);
      }

      base.totalGeral = obterNumero(base.totalGeral);

      mapa.set(userIdSeguro, base);
      continue;
    }

    const existente = mapa.get(userIdSeguro);

    existente.nome = membroOficial.nome;
    existente.user = membroOficial.user;

    for (const categoria of categorias) {
      existente[categoria.campo] =
        obterNumero(existente[categoria.campo]) +
        obterNumero(pontuacao[categoria.campo]);

      existente[categoria.campo] = arredondarNumero(existente[categoria.campo]);
    }

    existente.totalGeral =
      obterNumero(existente.totalGeral) +
      obterNumero(pontuacao.totalGeral);

    existente.totalGeral = arredondarNumero(existente.totalGeral);
  }

  return Array.from(mapa.values()).map((pontuacao) => {
    const totalCategorias = calcularTotalPorCategorias(pontuacao);
    const totalAntigo = arredondarNumero(pontuacao.totalGeral);

    const temCategoriaRegistrada = categorias.some((categoria) => {
      return obterNumero(pontuacao[categoria.campo]) !== 0;
    });

    return {
      ...pontuacao,
      totalGeral: temCategoriaRegistrada
        ? totalCategorias
        : totalAntigo
    };
  });
}

function criarCardPontuacao(pontuacao) {
  const totalGeral = formatarTotalGeral(pontuacao.totalGeral);
  const saldoNegativo = obterNumero(pontuacao.totalGeral) < 0;

  return `
    <article class="member-admin-card member-list-card">
      <div class="member-admin-header">
        <div>
          <h2>${escaparHtml(pontuacao.nome || "Sem nome")}</h2>
          <button
            type="button"
            class="user-history-trigger"
            data-user="${escaparHtml(pontuacao.user || "")}"
            aria-label="Ver as 3 últimas movimentações de ${escaparHtml(pontuacao.user || "")}"
          >
            ${escaparHtml(pontuacao.user || "")}
          </button>
        </div>
      </div>

      <div class="point-card-content">
        <div class="point-card-header">
          <strong class="${saldoNegativo ? "negative-balance" : ""}">
            ${escaparHtml(totalGeral)} pts
          </strong>
          ${saldoNegativo ? '<span class="debt-label">Saldo devedor</span>' : ""}
        </div>
      </div>
    </article>
  `;
}

function renderizarMovimentacoes(registros) {
  if (registros.length === 0) {
    movimentacoesConteudo.innerHTML = `
      <p class="movements-empty">Nenhuma movimentação encontrada para este user.</p>
    `;
    return;
  }

  movimentacoesConteudo.innerHTML = registros
    .map((item) => {
      const pontos = formatarPontos(item.pontos);
      const classePontos = Number(item.pontos || 0) < 0 ? "negative" : "positive";

      return `
        <article class="movement-item">
          <div class="movement-item-header">
            <strong>${escaparHtml(formatarCategoria(item.categoria))}</strong>
            <span class="movement-points ${classePontos}">${escaparHtml(pontos)} pts</span>
          </div>
          <p>${escaparHtml(item.semana || "Semana não informada")}</p>
          ${item.origem ? `<small>${escaparHtml(item.origem)}</small>` : ""}
        </article>
      `;
    })
    .join("");
}

function abrirModalMovimentacoes() {
  if (typeof movimentacoesModal.showModal === "function") {
    movimentacoesModal.showModal();
    return;
  }

  movimentacoesModal.setAttribute("open", "");
}

async function carregarUltimasMovimentacoes(user) {
  const userNormalizado = normalizarUser(user);

  movimentacoesUser.textContent = userNormalizado;
  movimentacoesConteudo.innerHTML = `
    <p class="movements-loading">Carregando movimentações...</p>
  `;
  abrirModalMovimentacoes();

  try {
    const registros = await listarHistoricoPorUser({
      user: userNormalizado,
      limite: 3,
      incluirOcultos: false
    });

    if (movimentacoesUser.textContent !== userNormalizado) {
      return;
    }

    renderizarMovimentacoes(registros);
  } catch (erro) {
    console.error(erro);
    movimentacoesConteudo.innerHTML = `
      <p class="movements-empty error">
        Não foi possível carregar as movimentações. Tente novamente.
      </p>
    `;
  }
}

function ordenarPontuacoes(lista) {
  return [...lista].sort((a, b) => {
    const totalA = obterNumero(a.totalGeral);
    const totalB = obterNumero(b.totalGeral);

    if (totalB !== totalA) {
      return totalB - totalA;
    }

    const nomeA = String(a.nome || "").toLowerCase();
    const nomeB = String(b.nome || "").toLowerCase();

    return nomeA.localeCompare(nomeB);
  });
}

function renderizarPontuacoes(
  lista,
  mensagemVazia = "Nenhum usuário encontrado com essa busca."
) {
  totalUsuariosTexto.textContent = `Usuários encontrados: ${lista.length}`;

  if (lista.length === 0) {
    pontuacoesLista.innerHTML = "";

    mostrarMensagem(
      pontuacoesMessage,
      mensagemVazia,
      "error"
    );

    return;
  }

  pontuacoesMessage.textContent = "";
  pontuacoesMessage.className = "message";

  pontuacoesLista.innerHTML = ordenarPontuacoes(lista)
    .map((pontuacao) => criarCardPontuacao(pontuacao))
    .join("");
}

function obterListaVisivelGeral() {
  return pontuacoesCarregadas.filter((pontuacao) => {
    return obterNumero(pontuacao.totalGeral) !== 0;
  });
}

function filtrarPontuacoes() {
  const termo = buscaUser.value.trim();

  if (!termo) {
    renderizarPontuacoes(
      obterListaVisivelGeral(),
      "Nenhum usuário com saldo diferente de 0 encontrado."
    );

    return;
  }

  const termoNormalizado = normalizarUser(termo);
  const termoIdSeguro = criarIdSeguro(termoNormalizado);

  const filtradas = pontuacoesCarregadas.filter((pontuacao) => {
    const user = normalizarUser(pontuacao.user || "");
    const userIdSeguro = criarIdSeguro(user);

    return (
      user.includes(termoNormalizado) ||
      userIdSeguro.includes(termoIdSeguro)
    );
  });

  renderizarPontuacoes(filtradas);
}

async function carregarPontuacoes() {
  modoPontuacaoTexto.textContent = "Exibindo pontuação geral acumulada";

  try {
    const membros = await listarMembros();

    membrosPorIdSeguro = criarMapaDeMembros(membros);

    const pontuacoes = await listarPontuacaoGeral();

    pontuacoesCarregadas = agruparPontuacoesPorUser(pontuacoes);

    renderizarPontuacoes(
      obterListaVisivelGeral(),
      "Nenhum usuário com saldo diferente de 0 encontrado."
    );
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      pontuacoesMessage,
      "Erro ao carregar as pontuações. Tente novamente.",
      "error"
    );
  }
}

buscaUser.addEventListener("input", () => {
  filtrarPontuacoes();
});

limparBuscaBtn.addEventListener("click", () => {
  buscaUser.value = "";

  renderizarPontuacoes(
    obterListaVisivelGeral(),
    "Nenhum usuário com saldo diferente de 0 encontrado."
  );
});

pontuacoesLista.addEventListener("click", (evento) => {
  const botaoUser = evento.target.closest(".user-history-trigger");

  if (!botaoUser) {
    return;
  }

  carregarUltimasMovimentacoes(botaoUser.dataset.user || "");
});

fecharMovimentacoesBtn.addEventListener("click", () => {
  movimentacoesModal.close();
});

movimentacoesModal.addEventListener("click", (evento) => {
  if (evento.target === movimentacoesModal) {
    movimentacoesModal.close();
  }
});

carregarPontuacoes();
