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
  listarMembros
} from "../services/membros.service.js";

import {
  criarIdSeguro,
  escaparHtml,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

import {
  SUBS_OFICIAIS
} from "../core/subs.js";

protegerPagina();
configurarBotaoLogout();

const mesAtualTexto = document.getElementById("mesAtualTexto");
const totalPontosMes = document.getElementById("totalPontosMes");
const totalMembrosPontuados = document.getElementById("totalMembrosPontuados");
const totalEnviosMes = document.getElementById("totalEnviosMes");
const subMaisPontos = document.getElementById("subMaisPontos");
const rankingSubsLista = document.getElementById("rankingSubsLista");
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
    colecao: "jornadaMistica",
    nome: "Jornada Mística"
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
  },
  {
    colecao: "casas",
    nome: "Casas"
  }
];

const subsOficiais = SUBS_OFICIAIS.map((sub) => sub.nome);

let membrosPorIdSeguro = new Map();

function obterMesAtual() {
  const hoje = new Date();

  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  return {
    inicio,
    fim,
    texto: hoje.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    })
  };
}

function converterDataPtBrParaDate(dataTexto) {
  const partes = String(dataTexto || "").trim().split("/");

  if (partes.length !== 3) {
    return null;
  }

  const dia = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const ano = Number(partes[2]);

  if (!dia || Number.isNaN(mes) || !ano) {
    return null;
  }

  return new Date(ano, mes, dia);
}

function extrairPeriodoDaSemana(semana) {
  const texto = String(semana || "");
  const partes = texto.split(" a ");

  if (partes.length !== 2) {
    return null;
  }

  const inicio = converterDataPtBrParaDate(partes[0]);
  const fim = converterDataPtBrParaDate(partes[1]);

  if (!inicio || !fim) {
    return null;
  }

  return {
    inicio,
    fim
  };
}

function periodoSobrepoeMes(semana, mesAtual) {
  const periodo = extrairPeriodoDaSemana(semana);

  if (!periodo) {
    return false;
  }

  return periodo.inicio <= mesAtual.fim && periodo.fim >= mesAtual.inicio;
}

function filtrarPorMesAtual(lista, mesAtual) {
  return lista.filter((item) => {
    return periodoSobrepoeMes(item.semana, mesAtual);
  });
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

function obterNumero(valor) {
  const numero = Number(valor || 0);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
}

function calcularTotalPontos(pontuacoes) {
  return pontuacoes.reduce((total, item) => {
    return total + obterNumero(item.totalGeral);
  }, 0);
}

function agruparPontuacoesMensaisPorMembro(pontuacoes) {
  const mapa = new Map();

  for (const pontuacao of pontuacoes) {
    const userNormalizado = normalizarUser(pontuacao.user || "");
    const userIdSeguro = criarIdSeguro(userNormalizado);
    const membroOficial = membrosPorIdSeguro.get(userIdSeguro);

    if (!userIdSeguro || !membroOficial) {
      continue;
    }

    if (!mapa.has(userIdSeguro)) {
      mapa.set(userIdSeguro, {
        nome: membroOficial.nome,
        user: membroOficial.user,
        total: 0
      });
    }

    const registro = mapa.get(userIdSeguro);

    registro.nome = membroOficial.nome;
    registro.user = membroOficial.user;
    registro.total += obterNumero(pontuacao.totalGeral);
  }

  return Array.from(mapa.values()).filter((item) => item.total > 0);
}

function montarRankingSubs(pontuacoesSubs) {
  const mapa = new Map();

  for (const sub of subsOficiais) {
    mapa.set(sub, 0);
  }

  for (const item of pontuacoesSubs) {
    const sub = item.sub || "Sem sub";
    const pontos = obterNumero(item.pontos);

    mapa.set(sub, (mapa.get(sub) || 0) + pontos);
  }

  return Array.from(mapa.entries())
    .map(([sub, pontos]) => ({
      sub,
      pontos
    }))
    .filter((item) => item.pontos !== 0)
    .sort((a, b) => {
      if (b.pontos !== a.pontos) {
        return b.pontos - a.pontos;
      }

      return a.sub.localeCompare(b.sub);
    });
}

function obterSubMaisPontos(pontuacoesSubs) {
  const ranking = montarRankingSubs(pontuacoesSubs);

  if (ranking.length === 0) {
    return "—";
  }

  return `${ranking[0].sub} (${ranking[0].pontos} pts)`;
}

function contarEnviosMensais(enviosSubs, outrosEnvios) {
  return enviosSubs.length + outrosEnvios.length;
}

function renderizarRankingSubs(pontuacoesSubs) {
  const ranking = montarRankingSubs(pontuacoesSubs);

  if (!rankingSubsLista) {
    return;
  }

  if (ranking.length === 0) {
    rankingSubsLista.innerHTML = `
      <div class="list-item">
        Nenhum sub pontuou neste mês ainda.
      </div>
    `;

    return;
  }

  rankingSubsLista.innerHTML = ranking
    .map((item, index) => {
      return `
        <div class="list-item ranking-sub-item">
          <strong>${index + 1}º lugar — ${escaparHtml(item.sub)}</strong><br>
          Pontuação do mês: ${Number(item.pontos || 0)} pts
        </div>
      `;
    })
    .join("");
}

async function carregarDashboard() {
  const mesAtual = obterMesAtual();

  mesAtualTexto.textContent = `Mês atual: ${mesAtual.texto}`;

  try {
    await configurarMenuPorPermissao();

    const membros = await listarMembros();

    membrosPorIdSeguro = criarMapaDeMembros(membros);

    const pontuacoesTodas = await listarPontuacaoGeral();
    const enviosSubsTodos = await listarEnviosSubs();
    const pontuacoesSubsTodas = await listarPontuacoesSubs();

    const outrosEnviosAgrupados = await Promise.all(
      categoriasEnvio.map((categoria) => {
        return listarEnviosCategoria({
          colecao: categoria.colecao
        });
      })
    );

    const outrosEnviosTodos = outrosEnviosAgrupados.flat();

    const pontuacoesDoMes = filtrarPorMesAtual(pontuacoesTodas, mesAtual);
    const enviosSubsDoMes = filtrarPorMesAtual(enviosSubsTodos, mesAtual);
    const pontuacoesSubsDoMes = filtrarPorMesAtual(pontuacoesSubsTodas, mesAtual);
    const outrosEnviosDoMes = filtrarPorMesAtual(outrosEnviosTodos, mesAtual);

    const membrosPontuados = agruparPontuacoesMensaisPorMembro(pontuacoesDoMes);

    totalPontosMes.textContent = calcularTotalPontos(pontuacoesDoMes);
    totalMembrosPontuados.textContent = membrosPontuados.length;
    totalEnviosMes.textContent = contarEnviosMensais(enviosSubsDoMes, outrosEnviosDoMes);
    subMaisPontos.textContent = obterSubMaisPontos(pontuacoesSubsDoMes);

    renderizarRankingSubs(pontuacoesSubsDoMes);

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
