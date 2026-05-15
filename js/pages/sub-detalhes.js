import {
  limparPontuacoesSubSemana,
  listarPontuacoesSubs
} from "../services/pontuacoes.service.js";

import {
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

import {
  protegerPagina,
  configurarBotaoLogout,
  configurarMenuPorPermissao
} from "../core/auth.js";

protegerPagina();
configurarBotaoLogout();

const subTitulo = document.getElementById("subTitulo");
const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalMembrosTexto = document.getElementById("totalMembrosTexto");
const totalPontosTexto = document.getElementById("totalPontosTexto");
const subTabela = document.getElementById("subTabela");
const subMessage = document.getElementById("subMessage");
const limparSubSemanaBtn = document.getElementById("limparSubSemanaBtn");

let subAtual = "";
let registrosAtuais = [];

function obterSubDaUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("sub") || "";
}

function agruparPorUser(registros) {
  const mapa = new Map();

  for (const item of registros) {
    const user = normalizarUser(item.user || "");

    if (!mapa.has(user)) {
      mapa.set(user, {
        nome: item.nome || "",
        user,
        pontos: 0
      });
    }

    const registro = mapa.get(user);

    registro.nome = item.nome || registro.nome;
    registro.pontos += Number(item.pontos || 0);
  }

  return Array.from(mapa.values()).sort((a, b) => {
    return String(a.nome || "").localeCompare(String(b.nome || ""));
  });
}

function calcularTotalPontos(membros) {
  return membros.reduce((total, membro) => {
    return total + Number(membro.pontos || 0);
  }, 0);
}

function renderizarTabela(registros) {
  const membros = agruparPorUser(registros);
  const totalPontos = calcularTotalPontos(membros);

  totalMembrosTexto.textContent = `Membros registrados: ${membros.length}`;
  totalPontosTexto.textContent = `Total de pontos: ${totalPontos}`;

  if (membros.length === 0) {
    subTabela.innerHTML = `
      <tr>
        <td colspan="3">Nenhum membro registrado neste sub durante a semana atual.</td>
      </tr>
    `;

    return;
  }

  subTabela.innerHTML = membros
    .map((membro) => {
      return `
        <tr>
          <td>${escaparHtml(membro.nome || "")}</td>
          <td>${escaparHtml(membro.user || "")}</td>
          <td>${Number(membro.pontos || 0)}</td>
        </tr>
      `;
    })
    .join("");
}

async function carregarSub() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  subAtual = obterSubDaUrl();

  if (!subAtual) {
    subTitulo.textContent = "Sub não informado";

    mostrarMensagem(
      subMessage,
      "Nenhum sub foi informado na URL.",
      "error"
    );

    limparSubSemanaBtn.disabled = true;
    renderizarTabela([]);

    return;
  }

  subTitulo.textContent = subAtual;

  try {
    await configurarMenuPorPermissao();

    registrosAtuais = await listarPontuacoesSubs(semanaAtual, subAtual);

    renderizarTabela(registrosAtuais);

    subMessage.textContent = "";
    subMessage.className = "message";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      subMessage,
      "Erro ao carregar detalhes do sub. Tente novamente.",
      "error"
    );
  }
}

limparSubSemanaBtn.addEventListener("click", async () => {
  const semanaAtual = gerarSemanaAtual();

  if (!subAtual) {
    mostrarMensagem(
      subMessage,
      "Nenhum sub foi informado para limpar.",
      "error"
    );

    return;
  }

  if (registrosAtuais.length === 0) {
    mostrarMensagem(
      subMessage,
      "Não há registros deste sub para limpar nesta semana.",
      "error"
    );

    return;
  }

  const confirmar = window.confirm(
    `Tem certeza que deseja limpar somente o sub ${subAtual} da semana ${semanaAtual}?\n\nIsso apagará os registros internos deste sub e os envios correspondentes, mas NÃO remove os pontos da Pontuação Geral.`
  );

  if (!confirmar) {
    return;
  }

  try {
    limparSubSemanaBtn.disabled = true;
    limparSubSemanaBtn.textContent = "Limpando...";

    const resultado = await limparPontuacoesSubSemana({
      semana: semanaAtual,
      sub: subAtual
    });

    mostrarMensagem(
      subMessage,
      `Sub limpo com sucesso. Registros removidos: ${resultado.registrosRemovidos}. Envios removidos: ${resultado.enviosRemovidos}.`,
      "success"
    );

    await carregarSub();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      subMessage,
      `Erro ao limpar este sub: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    limparSubSemanaBtn.disabled = false;
    limparSubSemanaBtn.textContent = "Limpar este sub da semana";
  }
});

carregarSub();
