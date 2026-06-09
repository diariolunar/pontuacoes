import {
  limparPontuacoesCategoriaSemana,
  listarPontuacoesCategoria
} from "../services/pontuacoes.service.js";

import {
  configurarBotaoLogout,
  configurarMenuPorPermissao,
  protegerPagina
} from "../core/auth.js";

import {
  confirmarModal,
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem
} from "../core/utils.js";

protegerPagina();
configurarBotaoLogout();

const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalRegistrosTexto = document.getElementById("totalRegistrosTexto");
const casasTabela = document.getElementById("casasTabela");
const casasMessage = document.getElementById("casasMessage");
const limparSemanaBtn = document.getElementById("limparSemanaBtn");

function formatarPontos(pontos) {
  const numero = Number(pontos || 0);

  if (numero > 0) {
    return `+${numero}`;
  }

  return String(numero);
}

function renderizarTabela(registros) {
  totalRegistrosTexto.textContent = `Registros encontrados: ${registros.length}`;

  if (registros.length === 0) {
    casasTabela.innerHTML = `
      <tr>
        <td colspan="4">Nenhum ponto das Casas registrado nesta semana.</td>
      </tr>
    `;

    return;
  }

  casasTabela.innerHTML = registros
    .map((item) => {
      return `
        <tr>
          <td>${escaparHtml(item.nome || "")}</td>
          <td>${escaparHtml(item.user || "")}</td>
          <td>${escaparHtml(formatarPontos(item.pontos))}</td>
          <td>${escaparHtml(item.descricao || "")}</td>
        </tr>
      `;
    })
    .join("");
}

async function carregarCasas() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  try {
    await configurarMenuPorPermissao();

    const registros = await listarPontuacoesCategoria({
      colecao: "casas",
      semana: semanaAtual
    });

    renderizarTabela(registros);

    casasMessage.textContent = "";
    casasMessage.className = "message";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      casasMessage,
      "Erro ao carregar pontos das Casas. Tente novamente.",
      "error"
    );
  }
}

limparSemanaBtn.addEventListener("click", async () => {
  const semanaAtual = gerarSemanaAtual();

  const confirmar = await confirmarModal({
    titulo: "Limpar pontos das Casas",
    texto: `Tem certeza que deseja limpar os registros das Casas da semana ${semanaAtual}?\n\nA Pontuação Geral não será apagada.`,
    tipo: "warning",
    textoConfirmar: "Limpar registros",
    textoCancelar: "Cancelar"
  });

  if (!confirmar) {
    return;
  }

  try {
    limparSemanaBtn.disabled = true;
    limparSemanaBtn.textContent = "Limpando...";

    await limparPontuacoesCategoriaSemana({
      colecao: "casas",
      semana: semanaAtual
    });

    mostrarMensagem(
      casasMessage,
      "Registros das Casas limpos com sucesso.",
      "success"
    );

    await carregarCasas();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      casasMessage,
      `Erro ao limpar pontos das Casas: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    limparSemanaBtn.disabled = false;
    limparSemanaBtn.textContent = "Limpar lista da semana";
  }
});

carregarCasas();