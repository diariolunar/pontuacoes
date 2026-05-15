import {
  listarAjustesManuais,
  registrarAjusteManual
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

const ajusteForm = document.getElementById("ajusteForm");
const nomeMembro = document.getElementById("nomeMembro");
const userMembro = document.getElementById("userMembro");
const tipoAjuste = document.getElementById("tipoAjuste");
const pontosAjuste = document.getElementById("pontosAjuste");
const motivoAjuste = document.getElementById("motivoAjuste");
const ajusteMessage = document.getElementById("ajusteMessage");
const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalAjustesTexto = document.getElementById("totalAjustesTexto");
const ajustesTabela = document.getElementById("ajustesTabela");

function formatarTipo(tipo) {
  if (tipo === "remover") return "Remoção";
  return "Adição";
}

function formatarPontos(pontos) {
  const numero = Number(pontos || 0);

  if (numero > 0) {
    return `+${numero}`;
  }

  return String(numero);
}

function renderizarAjustes(ajustes) {
  totalAjustesTexto.textContent = `Ajustes registrados: ${ajustes.length}`;

  if (ajustes.length === 0) {
    ajustesTabela.innerHTML = `
      <tr>
        <td colspan="5">Nenhum ajuste manual registrado nesta semana.</td>
      </tr>
    `;

    return;
  }

  ajustesTabela.innerHTML = ajustes
    .map((ajuste) => {
      return `
        <tr>
          <td>${escaparHtml(ajuste.nome || "")}</td>
          <td>${escaparHtml(ajuste.user || "")}</td>
          <td>${escaparHtml(formatarTipo(ajuste.tipo))}</td>
          <td>${escaparHtml(formatarPontos(ajuste.pontos))}</td>
          <td>${escaparHtml(ajuste.motivo || "")}</td>
        </tr>
      `;
    })
    .join("");
}

async function carregarAjustes() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  try {
    await configurarMenuPorPermissao();

    const ajustes = await listarAjustesManuais(semanaAtual);

    renderizarAjustes(ajustes);
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      ajusteMessage,
      "Erro ao carregar ajustes manuais. Tente novamente.",
      "error"
    );
  }
}

ajusteForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nome = nomeMembro.value.trim();
  const user = normalizarUser(userMembro.value);
  const tipo = tipoAjuste.value;
  const pontos = Number(pontosAjuste.value || 0);
  const motivo = motivoAjuste.value.trim();
  const semana = gerarSemanaAtual();
  const botao = ajusteForm.querySelector('button[type="submit"]');

  if (!nome || !user || !tipo || !pontos || !motivo) {
    mostrarMensagem(
      ajusteMessage,
      "Preencha todos os campos antes de salvar o ajuste.",
      "error"
    );

    return;
  }

  if (pontos <= 0) {
    mostrarMensagem(
      ajusteMessage,
      "A quantidade de pontos precisa ser maior que zero.",
      "error"
    );

    return;
  }

  const textoConfirmacao = tipo === "remover"
    ? `Tem certeza que deseja REMOVER ${pontos} pontos de ${nome} (${user})?`
    : `Tem certeza que deseja ADICIONAR ${pontos} pontos para ${nome} (${user})?`;

  const confirmar = window.confirm(
    `${textoConfirmacao}\n\nMotivo: ${motivo}`
  );

  if (!confirmar) {
    return;
  }

  try {
    botao.disabled = true;
    botao.textContent = "Salvando...";

    mostrarMensagem(
      ajusteMessage,
      "Salvando ajuste manual...",
      "success"
    );

    await registrarAjusteManual({
      semana,
      nome,
      user,
      tipo,
      pontos,
      motivo
    });

    mostrarMensagem(
      ajusteMessage,
      "Ajuste manual registrado com sucesso.",
      "success"
    );

    ajusteForm.reset();

    await carregarAjustes();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      ajusteMessage,
      `Erro ao salvar ajuste: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    botao.disabled = false;
    botao.textContent = "Salvar ajuste";
  }
});

carregarAjustes();