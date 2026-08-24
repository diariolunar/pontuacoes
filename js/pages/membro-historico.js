import {
  listarHistoricoPorUser,
  listarPontuacaoGeral
} from "../services/pontuacoes.service.js";

import {
  configurarBotaoLogout,
  configurarMenuPorPermissao,
  protegerPagina
} from "../core/auth.js";

import {
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

protegerPagina();
configurarBotaoLogout();

const historicoTitulo = document.getElementById("historicoTitulo");
const historicoDescricao = document.getElementById("historicoDescricao");
const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalHistoricoTexto = document.getElementById("totalHistoricoTexto");
const totalPontosTexto = document.getElementById("totalPontosTexto");
const historicoTabela = document.getElementById("historicoTabela");
const historicoMessage = document.getElementById("historicoMessage");

const camposCategorias = [
  "total_subs",
  "total_leituraLunar",
  "total_chuvaEstrelas",
  "total_adms",
  "total_diarioLunar",
  "total_jornadaMistica",
  "total_ascensao",
  "total_redesSociais",
  "total_divulgacoes",
  "total_casas",
  "total_ajustes",
  "total_lojaLunar"
];

function obterUserDaUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("user") || "";
}

function formatarCategoria(categoria) {
  const mapa = {
    subs: "Subs",
    leituraLunar: "Leitura Lunar",
    chuvaEstrelas: "Chuva de Estrelas",
    adms: "Pontuação dos ADMs",
    diarioLunar: "Diário Lunar",
    jornadaMistica: "Jornada Mística",
    ascensao: "Ascensão",
    redesSociais: "Redes Sociais",
    divulgacoes: "Divulgações",
    casas: "Casas",
    ajustes: "Ajustes Manuais",
    lojaLunar: "Loja Lunar"
  };

  return mapa[categoria] || categoria || "Sem categoria";
}

function formatarPontos(pontos) {
  const numero = arredondarNumero(pontos);
  const texto = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2
  }).format(Math.abs(numero));

  if (numero > 0) {
    return `+${texto}`;
  }

  return numero < 0 ? `-${texto}` : "0";
}

function arredondarNumero(valor) {
  const numero = Number(valor || 0);

  return Math.round(((Number.isNaN(numero) ? 0 : numero) + Number.EPSILON) * 100) / 100;
}

function calcularPontuacaoTotal(pontuacoes, user) {
  const userNormalizado = normalizarUser(user);
  const pontuacoesDoMembro = pontuacoes.filter((pontuacao) => {
    return normalizarUser(pontuacao.user || "") === userNormalizado;
  });
  const totaisPorCategoria = Object.fromEntries(
    camposCategorias.map((campo) => [campo, 0])
  );
  let totalAntigo = 0;

  for (const pontuacao of pontuacoesDoMembro) {
    totalAntigo += Number(pontuacao.totalGeral || 0);

    for (const campo of camposCategorias) {
      totaisPorCategoria[campo] += Number(pontuacao[campo] || 0);
    }
  }

  const temCategorias = camposCategorias.some((campo) => totaisPorCategoria[campo] !== 0);
  const totalCategorias = camposCategorias.reduce((total, campo) => {
    return total + totaisPorCategoria[campo];
  }, 0);

  return arredondarNumero(temCategorias ? totalCategorias : totalAntigo);
}

function renderizarHistorico(registros, pontuacaoTotal) {
  totalHistoricoTexto.textContent = `Registros encontrados: ${registros.length}`;
  totalPontosTexto.textContent = `Pontuação atual: ${formatarPontos(pontuacaoTotal)}`;

  if (registros.length === 0) {
    historicoTabela.innerHTML = `
      <tr>
        <td colspan="4">Nenhum lançamento encontrado para este membro.</td>
      </tr>
    `;

    return;
  }

  historicoTabela.innerHTML = registros
    .map((item) => {
      return `
        <tr>
          <td>${escaparHtml(item.semana || "")}</td>
          <td>${escaparHtml(formatarCategoria(item.categoria))}</td>
          <td>${escaparHtml(formatarPontos(item.pontos))}</td>
          <td>${escaparHtml(item.origem || "")}</td>
        </tr>
      `;
    })
    .join("");
}

async function carregarHistorico() {
  const user = obterUserDaUrl();
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  if (!user) {
    historicoTitulo.textContent = "Membro não informado";
    historicoDescricao.textContent = "Volte para a tela de membros e escolha um membro para visualizar.";

    mostrarMensagem(
      historicoMessage,
      "Nenhum user foi informado na URL.",
      "error"
    );

    return;
  }

  const userNormalizado = normalizarUser(user);

  historicoTitulo.textContent = userNormalizado;
  historicoDescricao.textContent = `Histórico de pontuação registrado para ${userNormalizado}.`;

  try {
    await configurarMenuPorPermissao();

    const [historico, pontuacoesGerais] = await Promise.all([
      listarHistoricoPorUser({ user: userNormalizado }),
      listarPontuacaoGeral()
    ]);
    const pontuacaoTotal = calcularPontuacaoTotal(pontuacoesGerais, userNormalizado);

    renderizarHistorico(historico, pontuacaoTotal);

    historicoMessage.textContent = "";
    historicoMessage.className = "message";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      historicoMessage,
      "Erro ao carregar histórico do membro. Tente novamente.",
      "error"
    );
  }
}

carregarHistorico();
