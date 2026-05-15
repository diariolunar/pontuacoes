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
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem
} from "../core/utils.js";

export function iniciarListaCategoriaVariavel({
  colecao,
  origem,
  tabelaId,
  messageId,
  semanaTextoId,
  totalTextoId,
  limparBtnId
}) {
  protegerPagina();
  configurarBotaoLogout();

  const semanaAtualTexto = document.getElementById(semanaTextoId);
  const totalMembrosTexto = document.getElementById(totalTextoId);
  const tabela = document.getElementById(tabelaId);
  const message = document.getElementById(messageId);
  const limparSemanaBtn = document.getElementById(limparBtnId);

  function renderizarTabela(registros) {
    totalMembrosTexto.textContent = `Registros encontrados: ${registros.length}`;

    if (registros.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="4">Nenhum registro encontrado nesta semana.</td>
        </tr>
      `;

      return;
    }

    tabela.innerHTML = registros
      .map((registro) => {
        return `
          <tr>
            <td>${escaparHtml(registro.nome || "")}</td>
            <td>${escaparHtml(registro.user || "")}</td>
            <td>${Number(registro.pontos || 0)}</td>
            <td>${escaparHtml(registro.descricao || "")}</td>
          </tr>
        `;
      })
      .join("");
  }

  async function carregarRegistros() {
    const semanaAtual = gerarSemanaAtual();

    semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

    try {
      await configurarMenuPorPermissao();

      const registros = await listarPontuacoesCategoria({
        colecao,
        semana: semanaAtual
      });

      renderizarTabela(registros);

      message.textContent = "";
      message.className = "message";
    } catch (erro) {
      console.error(erro);

      mostrarMensagem(
        message,
        `Erro ao carregar ${origem}. Tente novamente.`,
        "error"
      );
    }
  }

  limparSemanaBtn.addEventListener("click", async () => {
    const semanaAtual = gerarSemanaAtual();

    const confirmar = window.confirm(
      `Tem certeza que deseja limpar a lista de ${origem} da semana ${semanaAtual}?\n\nIsso NÃO remove os pontos da Pontuação Geral.`
    );

    if (!confirmar) {
      return;
    }

    try {
      limparSemanaBtn.disabled = true;
      limparSemanaBtn.textContent = "Limpando...";

      const resultado = await limparPontuacoesCategoriaSemana({
        colecao,
        semana: semanaAtual
      });

      mostrarMensagem(
        message,
        `Lista da semana limpa com sucesso. Registros removidos: ${resultado.registrosRemovidos}.`,
        "success"
      );

      await carregarRegistros();
    } catch (erro) {
      console.error(erro);

      mostrarMensagem(
        message,
        `Erro ao limpar lista: ${erro.message || "tente novamente."}`,
        "error"
      );
    } finally {
      limparSemanaBtn.disabled = false;
      limparSemanaBtn.textContent = "Limpar lista da semana";
    }
  });

  carregarRegistros();
}