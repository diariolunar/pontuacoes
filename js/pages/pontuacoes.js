import {
  listarPontuacaoGeral
} from "../services/pontuacoes.service.js";

import {
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

const categorias = [
  {
    campo: "total_subs",
    nome: "Subs"
  },
  {
    campo: "total_leituraLunar",
    nome: "Leitura Lunar"
  },
  {
    campo: "total_chuvaEstrelas",
    nome: "Chuva de Estrelas"
  },
  {
    campo: "total_adms",
    nome: "Pontuação dos ADMs"
  },
  {
    campo: "total_diarioLunar",
    nome: "Diário Lunar"
  },
  {
    campo: "total_ascensao",
    nome: "Ascensão"
  },
  {
    campo: "total_redesSociais",
    nome: "Redes Sociais"
  },
  {
    campo: "total_divulgacoes",
    nome: "Divulgações"
  },
  {
    campo: "total_ajustes",
    nome: "Ajustes Manuais"
  }
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
      </div>
    </article>
  `;
}

function renderizarPontuacoes(lista) {
  totalUsuariosTexto.textContent = `Usuários encontrados: ${lista.length}`;

  if (lista.length === 0) {
    pontuacoesLista.innerHTML = "";

    mostrarMensagem(
      pontuacoesMessage,
      "Nenhum usuário encontrado com essa busca.",
      "error"
    );

    return;
  }

  pontuacoesMessage.textContent = "";
  pontuacoesMessage.className = "message";

  const listaOrdenada = [...lista].sort((a, b) => {
    const nomeA = String(a.nome || "").toLowerCase();
    const nomeB = String(b.nome || "").toLowerCase();

    return nomeA.localeCompare(nomeB);
  });

  pontuacoesLista.innerHTML = listaOrdenada
    .map((pontuacao) => criarCardPontuacao(pontuacao))
    .join("");
}

function filtrarPontuacoes() {
  const termo = buscaUser.value.trim();

  if (!termo) {
    renderizarPontuacoes(pontuacoesCarregadas);
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
    pontuacoesCarregadas = await listarPontuacaoGeral(semanaAtual);

    renderizarPontuacoes(pontuacoesCarregadas);
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
  renderizarPontuacoes(pontuacoesCarregadas);
});

carregarPontuacoes();