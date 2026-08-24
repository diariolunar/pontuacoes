import {
  limparPontuacoesSubSemana,
  listarHistoricoFichasSub,
  listarPontuacoesSubs
} from "../services/pontuacoes.service.js";

import {
  confirmarModal,
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

import {
  normalizarNomeSub,
  obterTituloSub
} from "../core/subs.js";

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
const historicoFichasBox = document.getElementById("historicoFichasBox");
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

function formatarDataEnvio(timestamp) {
  if (!timestamp?.seconds) {
    return "Data não registrada";
  }

  return new Date(timestamp.seconds * 1000).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderizarHistoricoFichas(fichas) {
  if (!fichas.length) {
    historicoFichasBox.innerHTML = `
      <div class="list-item">Nenhuma ficha anterior foi enviada para este sub.</div>
    `;

    return;
  }

  historicoFichasBox.innerHTML = fichas.map((ficha) => `
    <details class="point-details list-item" style="margin-bottom: 12px;">
      <summary>
        <strong>${escaparHtml(formatarDataEnvio(ficha.criadoEm))}</strong>
        — Semana: ${escaparHtml(ficha.semana || "Não informada")}
        (${ficha.membros.length} ${ficha.membros.length === 1 ? "membro" : "membros"})
      </summary>

      <div class="table-wrap" style="margin-top: 12px;">
        <table>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">User</th>
              <th scope="col">Pontos</th>
            </tr>
          </thead>
          <tbody>
            ${ficha.membros.length
              ? ficha.membros.map((membro) => `
                <tr>
                  <td>${escaparHtml(membro.nome || "")}</td>
                  <td>${escaparHtml(membro.user || "")}</td>
                  <td>${Number(membro.pontos || 0)}</td>
                </tr>
              `).join("")
              : `<tr><td colspan="3">Os membros desta ficha não estão disponíveis.</td></tr>`}
          </tbody>
        </table>
      </div>
    </details>
  `).join("");
}

async function carregarSub() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  subAtual = normalizarNomeSub(obterSubDaUrl());

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

  subTitulo.textContent = obterTituloSub(subAtual);

  try {
    await configurarMenuPorPermissao();

    const [registrosSemana, fichasHistoricas] = await Promise.all([
      listarPontuacoesSubs(semanaAtual, subAtual),
      listarHistoricoFichasSub(subAtual)
    ]);

    registrosAtuais = registrosSemana;

    renderizarTabela(registrosAtuais);
    renderizarHistoricoFichas(fichasHistoricas);

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

  const confirmar = await confirmarModal({
    titulo: "Limpar registros do sub",
    texto: `Tem certeza que deseja limpar somente o sub ${subAtual} da semana ${semanaAtual}?\n\nIsso apagará os registros internos deste sub e os envios correspondentes, mas NÃO remove os pontos da Pontuação Geral.`,
    tipo: "warning",
    textoConfirmar: "Limpar registros",
    textoCancelar: "Cancelar"
  });

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
