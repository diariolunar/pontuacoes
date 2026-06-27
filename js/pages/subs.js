import {
  limparPontuacoesSubsSemana,
  listarEnviosSubs
} from "../services/pontuacoes.service.js";

import {
  confirmarModal,
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem
} from "../core/utils.js";

import {
  protegerPagina,
  configurarBotaoLogout,
  configurarMenuPorPermissao
} from "../core/auth.js";

import {
  SUBS_OFICIAIS
} from "../core/subs.js";

protegerPagina();
configurarBotaoLogout();

const subsLista = document.getElementById("subsLista");
const subsMessage = document.getElementById("subsMessage");
const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalSubsTexto = document.getElementById("totalSubsTexto");
const limparSemanaSubsBtn = document.getElementById("limparSemanaSubsBtn");

const subs = SUBS_OFICIAIS;

let enviosDaSemana = [];

function contarEnviosDoSub(envios, nomeSub) {
  return envios.filter((envio) => envio.sub === nomeSub).length;
}

function criarCardSub(sub, envios) {
  const totalEnvios = contarEnviosDoSub(envios, sub.nome);
  const enviado = totalEnvios > 0;

  if (sub.desativado) {
    return `
      <article class="sub-card disabled">
        <div>
          <h2>${escaparHtml(sub.titulo)}</h2>
          <p>Este sub está desativado no momento.</p>
        </div>

        <span class="status-pill muted">Desativado</span>
      </article>
    `;
  }

  const link = `./sub-detalhes.html?sub=${encodeURIComponent(sub.nome)}`;

  return `
    <a href="${link}" class="sub-card">
      <div>
        <h2>${escaparHtml(sub.titulo)}</h2>
        <p>${enviado ? `${totalEnvios} envio(s) nesta semana.` : "Nenhum envio nesta semana."}</p>
      </div>

      <span class="status-pill ${enviado ? "success" : "pending"}">
        ${enviado ? "Enviado" : "Pendente"}
      </span>
    </a>
  `;
}

function renderizarSubs(envios) {
  const subsAtivos = subs.filter((sub) => !sub.desativado);
  const subsEnviados = subsAtivos.filter((sub) => contarEnviosDoSub(envios, sub.nome) > 0);

  totalSubsTexto.textContent = `Subs enviados: ${subsEnviados.length} de ${subsAtivos.length}`;

  subsLista.innerHTML = subs
    .map((sub) => criarCardSub(sub, envios))
    .join("");
}

async function carregarSubs() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  try {
    await configurarMenuPorPermissao();

    enviosDaSemana = await listarEnviosSubs(semanaAtual);

    renderizarSubs(enviosDaSemana);

    subsMessage.textContent = "";
    subsMessage.className = "message";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      subsMessage,
      "Erro ao carregar os subs. Tente novamente.",
      "error"
    );
  }
}

limparSemanaSubsBtn.addEventListener("click", async () => {
  const semanaAtual = gerarSemanaAtual();

  if (enviosDaSemana.length === 0) {
    mostrarMensagem(
      subsMessage,
      "Não há envios de subs para limpar nesta semana.",
      "error"
    );

    return;
  }

  const confirmar = await confirmarModal({
    titulo: "Limpar listas dos subs",
    texto: `Tem certeza que deseja limpar TODAS as listas dos subs da semana ${semanaAtual}?\n\nIsso apagará os registros internos dos subs e os envios da semana, mas NÃO remove os pontos da Pontuação Geral.`,
    tipo: "warning",
    textoConfirmar: "Limpar listas",
    textoCancelar: "Cancelar"
  });

  if (!confirmar) {
    return;
  }

  try {
    limparSemanaSubsBtn.disabled = true;
    limparSemanaSubsBtn.textContent = "Limpando...";

    const resultado = await limparPontuacoesSubsSemana({
      semana: semanaAtual
    });

    mostrarMensagem(
      subsMessage,
      `Listas dos subs limpas com sucesso. Registros removidos: ${resultado.registrosRemovidos}. Envios removidos: ${resultado.enviosRemovidos}.`,
      "success"
    );

    await carregarSubs();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      subsMessage,
      `Erro ao limpar listas dos subs: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    limparSemanaSubsBtn.disabled = false;
    limparSemanaSubsBtn.textContent = "Limpar lista da semana";
  }
});

carregarSubs();
