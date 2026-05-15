import {
  listarHistoricoPorUser
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
    ascensao: "Ascensão",
    redesSociais: "Redes Sociais",
    divulgacoes: "Divulgações",
    ajustes: "Ajustes Manuais"
  };

  return mapa[categoria] || categoria || "Sem categoria";
}

function formatarPontos(pontos) {
  const numero = Number(pontos || 0);

  if (numero > 0) {
    return `+${numero}`;
  }

  return String(numero);
}

function renderizarHistorico(registros) {
  totalHistoricoTexto.textContent = `Registros encontrados: ${registros.length}`;

  const total = registros.reduce((soma, item) => {
    return soma + Number(item.pontos || 0);
  }, 0);

  totalPontosTexto.textContent = `Total no histórico: ${formatarPontos(total)}`;

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

    const historico = await listarHistoricoPorUser({
      user: userNormalizado
    });

    renderizarHistorico(historico);

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