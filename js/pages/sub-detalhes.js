import {
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
const subDescricao = document.getElementById("subDescricao");
const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalMembrosTexto = document.getElementById("totalMembrosTexto");
const subMembrosTabela = document.getElementById("subMembrosTabela");
const subDetalhesMessage = document.getElementById("subDetalhesMessage");

function obterSubDaUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("sub") || "";
}

function agruparPontuacoesPorUser(pontuacoes) {
  const mapa = new Map();

  for (const item of pontuacoes) {
    const userNormalizado = normalizarUser(item.user || "");

    if (!mapa.has(userNormalizado)) {
      mapa.set(userNormalizado, {
        nome: item.nome || "",
        user: userNormalizado,
        pontos: 0
      });
    }

    const registro = mapa.get(userNormalizado);

    registro.nome = item.nome || registro.nome;
    registro.pontos += Number(item.pontos || 0);
  }

  return Array.from(mapa.values()).sort((a, b) => {
    const nomeA = String(a.nome || "").toLowerCase();
    const nomeB = String(b.nome || "").toLowerCase();

    return nomeA.localeCompare(nomeB);
  });
}

function renderizarTabela(membros) {
  totalMembrosTexto.textContent = `Membros encontrados: ${membros.length}`;

  if (membros.length === 0) {
    subMembrosTabela.innerHTML = `
      <tr>
        <td colspan="3">Nenhuma pontuação encontrada para este sub nesta semana.</td>
      </tr>
    `;

    return;
  }

  subMembrosTabela.innerHTML = membros
    .map((membro) => {
      return `
        <tr>
          <td>${escaparHtml(membro.nome)}</td>
          <td>${escaparHtml(membro.user)}</td>
          <td>${Number(membro.pontos || 0)}</td>
        </tr>
      `;
    })
    .join("");
}

async function carregarDetalhesDoSub() {
  const sub = obterSubDaUrl();
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  if (!sub) {
    subTitulo.textContent = "Sub não informado";
    subDescricao.textContent = "Volte para a tela de subs e escolha um sub para visualizar.";

    mostrarMensagem(
      subDetalhesMessage,
      "Nenhum sub foi informado na URL.",
      "error"
    );

    return;
  }

  subTitulo.textContent = sub;
  subDescricao.textContent = `Pontuações registradas para ${sub} na semana atual.`;

  try {
    await configurarMenuPorPermissao();

    const pontuacoes = await listarPontuacoesSubs(semanaAtual, sub);
    const membrosAgrupados = agruparPontuacoesPorUser(pontuacoes);

    renderizarTabela(membrosAgrupados);

    subDetalhesMessage.textContent = "";
    subDetalhesMessage.className = "message";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      subDetalhesMessage,
      "Erro ao carregar os detalhes deste sub. Tente novamente.",
      "error"
    );
  }
}

carregarDetalhesDoSub();
