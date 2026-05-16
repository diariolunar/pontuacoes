import {
  listarPontuacaoGeral
} from "../services/pontuacoes.service.js";

import {
  listarMembros
} from "../services/membros.service.js";

import {
  criarIdSeguro,
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

const buscaUser = document.getElementById("buscaUser");
const limparBuscaBtn = document.getElementById("limparBuscaBtn");
const pontuacoesLista = document.getElementById("pontuacoesLista");
const pontuacoesMessage = document.getElementById("pontuacoesMessage");
const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalUsuariosTexto = document.getElementById("totalUsuariosTexto");

let pontuacoesCarregadas = [];
let usersCadastrados = new Set();

const categorias = [
  { campo: "total_subs", nome: "Subs" },
  { campo: "total_leituraLunar", nome: "Leitura Lunar" },
  { campo: "total_chuvaEstrelas", nome: "Chuva de Estrelas" },
  { campo: "total_adms", nome: "Pontuação dos ADMs" },
  { campo: "total_diarioLunar", nome: "Diário Lunar" },
  { campo: "total_ascensao", nome: "Ascensão" },
  { campo: "total_redesSociais", nome: "Redes Sociais" },
  { campo: "total_divulgacoes", nome: "Divulgações" },
  { campo: "total_ajustes", nome: "Ajustes Manuais" }
];

function obterNumero(valor) {
  const numero = Number(valor || 0);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
}

function formatarPontos(valor) {
  const numero = obterNumero(valor);

  if (numero > 0) {
    return `+${numero}`;
  }

  return String(numero);
}

function calcularTotalPorCategorias(pontuacao) {
  const total = categorias.reduce((soma, categoria) => {
    return soma + obterNumero(pontuacao[categoria.campo]);
  }, 0);

  if (total < 0) {
    return 0;
  }

  return total;
}

function agruparPontuacoesPorUser(pontuacoes) {
  const mapa = new Map();

  for (const pontuacao of pontuacoes) {
    const userNormalizado = normalizarUser(pontuacao.user || "");
    const userIdSeguro = criarIdSeguro(userNormalizado);

    if (!userNormalizado || !usersCadastrados.has(userIdSeguro)) {
      continue;
    }

    if (!mapa.has(userNormalizado)) {
      const base = {
        ...pontuacao,
        user: userNormalizado
      };

      for (const categoria of categorias) {
        base[categoria.campo] = obterNumero(base[categoria.campo]);
      }

      mapa.set(userNormalizado, base);
      continue;
    }

    const existente = mapa.get(userNormalizado);

    if (!existente.nome && pontuacao.nome) {
      existente.nome = pontuacao.nome;
    }

    if (
      pontuacao.nome &&
      obterNumero(pontuacao.totalGeral) > obterNumero(existente.totalGeral)
    ) {
      existente.nome = pontuacao.nome;
    }

    for (const categoria of categorias) {
      existente[categoria.campo] =
        obterNumero(existente[categoria.campo]) +
        obterNumero(pontuacao[categoria.campo]);
    }

    existente.totalGeral =
      obterNumero(existente.totalGeral) +
      obterNumero(pontuacao.totalGeral);
  }

  return Array.from(mapa.values()).map((pontuacao) => {
    const totalCategorias = calcularTotalPorCategorias(pontuacao);
    const totalAntigo = obterNumero(pontuacao.totalGeral);

    const temCategoriaRegistrada = categorias.some((categoria) => {
      return obterNumero(pontuacao[categoria.campo]) !== 0;
    });

    return {
      ...pontuacao,
      totalGeral: temCategoriaRegistrada
        ? totalCategorias
        : Math.max(0, totalAntigo)
    };
  });
}

function obterCategoriasComPontos(pontuacao) {
  return categorias
    .map((categoria) => {
      return {
        nome: categoria.nome,
        pontos: obterNumero(pontuacao[categoria.campo])
      };
    })
    .filter((categoria) => categoria.pontos !== 0);
}

function criarDetalhesCategorias(pontuacao) {
  const categoriasComPontos = obterCategoriasComPontos(pontuacao);

  if (categoriasComPontos.length === 0) {
    return `
      <div class="point-breakdown">
        <span>Nenhuma categoria com pontos registrada ainda.</span>
      </div>
    `;
  }

  return `
    <div class="point-breakdown">
      ${categoriasComPontos
        .map((categoria) => {
          return `
            <span>
              ${escaparHtml(categoria.nome)}: ${escaparHtml(formatarPontos(categoria.pontos))}
            </span>
          `;
        })
        .join("")}
    </div>
  `;
}

function criarCardPontuacao(pontuacao) {
  const totalGeral = obterNumero(pontuacao.totalGeral);
  const historicoUrl = `./membro-historico.html?user=${encodeURIComponent(pontuacao.user || "")}`;

  return `
    <article class="member-admin-card member-list-card">
      <div class="member-admin-header">
        <div>
          <h2>${escaparHtml(pontuacao.nome || "Sem nome")}</h2>
          <p>${escaparHtml(pontuacao.user || "")}</p>
        </div>
      </div>

      <div class="point-card-content">
        <div class="point-card-header">
          <strong>${totalGeral} pts</strong>
        </div>

        <details class="point-details">
          <summary>Ver categorias pontuadas</summary>

          ${criarDetalhesCategorias(pontuacao)}
        </details>

        <a href="${historicoUrl}" class="btn secondary small">
          Ver histórico
        </a>
      </div>
    </article>
  `;
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

function renderizarPontuacoes(lista, mensagemVazia = "Nenhum usuário encontrado com essa busca.") {
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
    return obterNumero(pontuacao.totalGeral) > 0;
  });
}

function filtrarPontuacoes() {
  const termo = buscaUser.value.trim();

  if (!termo) {
    renderizarPontuacoes(
      obterListaVisivelGeral(),
      "Nenhum usuário com pontuação acima de 0 encontrado nesta semana."
    );

    return;
  }

  const termoNormalizado = normalizarUser(termo);

  const filtradas = pontuacoesCarregadas.filter((pontuacao) => {
    const user = normalizarUser(pontuacao.user || "");

    return user.includes(termoNormalizado);
  });

  renderizarPontuacoes(filtradas);
}

async function carregarPontuacoes() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  try {
    const membros = await listarMembros();

    usersCadastrados = new Set(
      membros.map((membro) => criarIdSeguro(membro.user || ""))
    );

    const pontuacoes = await listarPontuacaoGeral(semanaAtual);

    pontuacoesCarregadas = agruparPontuacoesPorUser(pontuacoes);

    renderizarPontuacoes(
      obterListaVisivelGeral(),
      "Nenhum usuário com pontuação acima de 0 encontrado nesta semana."
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
    "Nenhum usuário com pontuação acima de 0 encontrado nesta semana."
  );
});

carregarPontuacoes();
