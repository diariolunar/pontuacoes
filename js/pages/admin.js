import {
  protegerPagina,
  configurarBotaoLogout,
  configurarMenuPorPermissao
} from "../core/auth.js";

import {
  listarEnviosCategoria,
  listarEnviosSubs,
  listarPontuacaoGeral,
  listarPontuacoesSubs
} from "../services/pontuacoes.service.js";

import {
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem
} from "../core/utils.js";

protegerPagina();
configurarBotaoLogout();

const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalPontosSemana = document.getElementById("totalPontosSemana");
const totalMembrosPontuados = document.getElementById("totalMembrosPontuados");
const totalEnviosSemana = document.getElementById("totalEnviosSemana");
const membroMaisPontos = document.getElementById("membroMaisPontos");
const subMaisPontos = document.getElementById("subMaisPontos");
const ultimosEnvios = document.getElementById("ultimosEnvios");
const dashboardMessage = document.getElementById("dashboardMessage");

const categoriasEnvio = [
  {
    colecao: "leituraLunar",
    nome: "Leitura Lunar"
  },
  {
    colecao: "chuvaEstrelas",
    nome: "Chuva de Estrelas"
  },
  {
    colecao: "pontuacaoAdms",
    nome: "Pontuação dos ADMs"
  },
  {
    colecao: "diarioLunar",
    nome: "Diário Lunar"
  },
  {
    colecao: "ascensao",
    nome: "Ascensão"
  },
  {
    colecao: "redesSociais",
    nome: "Redes Sociais"
  },
  {
    colecao: "divulgacoes",
    nome: "Divulgações"
  }
];

function calcularTotalPontos(pontuacoes) {
  return pontuacoes.reduce((total, item) => {
    return total + Number(item.totalGeral || 0);
  }, 0);
}

function obterMembroMaisPontos(pontuacoes) {
  if (pontuacoes.length === 0) return "—";

  const primeiro = [...pontuacoes].sort((a, b) => {
    return Number(b.totalGeral || 0) - Number(a.totalGeral || 0);
  })[0];

  return `${primeiro.nome || primeiro.user} (${Number(primeiro.totalGeral || 0)} pts)`;
}

function obterSubMaisPontos(pontuacoesSubs) {
  if (pontuacoesSubs.length === 0) return "—";

  const mapa = new Map();

  for (const item of pontuacoesSubs) {
    const sub = item.sub || "Sem sub";
    const pontos = Number(item.pontos || 0);

    mapa.set(sub, (mapa.get(sub) || 0) + pontos);
  }

  const lista = Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]);

  if (lista.length === 0) return "—";

  return `${lista[0][0]} (${lista[0][1]} pts)`;
}

function montarListaEnvios(enviosSubs, outrosEnvios) {
  const enviosFormatados = [
    ...enviosSubs.map((envio) => ({
      titulo: envio.sub || "Envio de sub",
      tipo: "Sub",
      semana: envio.semana,
      totalMembros: envio.totalMembros || 0,
      criadoEm: envio.criadoEm
    })),
    ...outrosEnvios.map((envio) => ({
      titulo: envio.origem || envio.categoria || "Envio",
      tipo: envio.origem || "Categoria",
      semana: envio.semana,
      totalMembros: envio.totalMembros || 0,
      criadoEm: envio.criadoEm
    }))
  ];

  return enviosFormatados.sort((a, b) => {
    const dataA = a.criadoEm?.seconds || 0;
    const dataB = b.criadoEm?.seconds || 0;

    return dataB - dataA;
  });
}

function renderizarUltimosEnvios(envios) {
  if (envios.length === 0) {
    ultimosEnvios.innerHTML = `
      <div class="list-item">
        Nenhum envio registrado nesta semana.
      </div>
    `;

    return;
  }

  ultimosEnvios.innerHTML = envios
    .slice(0, 10)
    .map((envio) => {
      return `
        <div class="list-item">
          <strong>${escaparHtml(envio.titulo)}</strong><br>
          Tipo: ${escaparHtml(envio.tipo)}<br>
          Semana: ${escaparHtml(envio.semana || "")}<br>
          Membros enviados: ${Number(envio.totalMembros || 0)}
        </div>
      `;
    })
    .join("");
}

async function carregarDashboard() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  try {
    await configurarMenuPorPermissao();

    const pontuacoes = await listarPontuacaoGeral(semanaAtual);
    const enviosSubs = await listarEnviosSubs(semanaAtual);
    const pontuacoesSubs = await listarPontuacoesSubs(semanaAtual);

    const outrosEnviosAgrupados = await Promise.all(
      categoriasEnvio.map((categoria) => {
        return listarEnviosCategoria({
          colecao: categoria.colecao,
          semana: semanaAtual
        });
      })
    );

    const outrosEnvios = outrosEnviosAgrupados.flat();
    const todosEnvios = montarListaEnvios(enviosSubs, outrosEnvios);

    totalPontosSemana.textContent = calcularTotalPontos(pontuacoes);
    totalMembrosPontuados.textContent = pontuacoes.length;
    totalEnviosSemana.textContent = todosEnvios.length;
    membroMaisPontos.textContent = obterMembroMaisPontos(pontuacoes);
    subMaisPontos.textContent = obterSubMaisPontos(pontuacoesSubs);

    renderizarUltimosEnvios(todosEnvios);

    dashboardMessage.textContent = "";
    dashboardMessage.className = "message";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      dashboardMessage,
      "Erro ao carregar o dashboard. Verifique o Firebase e tente novamente.",
      "error"
    );
  }
}

carregarDashboard();