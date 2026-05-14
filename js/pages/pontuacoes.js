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

function obterTotalCategoria(pontuacao, campo) {
  return Number(pontuacao[campo] || 0);
}

function criarCardPontuacao(pontuacao) {
  const totalSubs = obterTotalCategoria(pontuacao, "total_subs");
  const totalLeitura = obterTotalCategoria(pontuacao, "total_leituraLunar");
  const totalChuva = obterTotalCategoria(pontuacao, "total_chuvaEstrelas");
  const totalAdms = obterTotalCategoria(pontuacao, "total_adms");
  const totalDiario = obterTotalCategoria(pontuacao, "total_diarioLunar");
  const totalAscensao = obterTotalCategoria(pontuacao, "total_ascensao");
  const totalRedes = obterTotalCategoria(pontuacao, "total_redesSociais");
  const totalDivulgacoes = obterTotalCategoria(pontuacao, "total_divulgacoes");
  const totalAjustes = obterTotalCategoria(pontuacao, "total_ajustes");

  return `
    <article class="point-card">
      <div class="point-card-header">
        <div>
          <h2>${escaparHtml(pontuacao.nome || "Sem nome")}</h2>
          <p>${escaparHtml(pontuacao.user || "")}</p>
        </div>

        <strong>${Number(pontuacao.totalGeral || 0)} pts</strong>
      </div>

      <details class="point-details">
        <summary>Ver detalhes</summary>

        <div class="point-breakdown">
          <span>Subs: ${totalSubs}</span>
          <span>Leitura Lunar: ${totalLeitura}</span>
          <span>Chuva de Estrelas: ${totalChuva}</span>
          <span>ADMs: ${totalAdms}</span>
          <span>Diário Lunar: ${totalDiario}</span>
          <span>Ascensão: ${totalAscensao}</span>
          <span>Redes: ${totalRedes}</span>
          <span>Divulgações: ${totalDivulgacoes}</span>
          <span>Ajustes: ${totalAjustes}</span>
        </div>
      </details>
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
