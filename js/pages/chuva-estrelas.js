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
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

protegerPagina();
configurarBotaoLogout();

const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalMembrosTexto = document.getElementById("totalMembrosTexto");
const chuvaTabela = document.getElementById("chuvaTabela");
const chuvaMessage = document.getElementById("chuvaMessage");
const limparSemanaBtn = document.getElementById("limparSemanaBtn");

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

function renderizarTabela(membros) {
  totalMembrosTexto.textContent = `Membros registrados: ${membros.length}`;

  if (membros.length === 0) {
    chuvaTabela.innerHTML = `
      <tr>
        <td colspan="3">Nenhum membro registrado na Chuva de Estrelas desta semana.</td>
      </tr>
    `;

    return;
  }

  chuvaTabela.innerHTML = membros
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

async function carregarChuvaEstrelas() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  try {
    await configurarMenuPorPermissao();

    const registros = await listarPontuacoesCategoria({
      colecao: "chuvaEstrelas",
      semana: semanaAtual
    });

    const membros = agruparPorUser(registros);

    renderizarTabela(membros);

    chuvaMessage.textContent = "";
    chuvaMessage.className = "message";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      chuvaMessage,
      "Erro ao carregar a Chuva de Estrelas. Tente novamente.",
      "error"
    );
  }
}

limparSemanaBtn.addEventListener("click", async () => {
  const semanaAtual = gerarSemanaAtual();

  const confirmar = window.confirm(
    `Tem certeza que deseja limpar a lista da Chuva de Estrelas da semana ${semanaAtual}?\n\nIsso NÃO remove os pontos da Pontuação Geral.`
  );

  if (!confirmar) {
    return;
  }

  try {
    limparSemanaBtn.disabled = true;
    limparSemanaBtn.textContent = "Limpando...";

    const resultado = await limparPontuacoesCategoriaSemana({
      colecao: "chuvaEstrelas",
      semana: semanaAtual
    });

    mostrarMensagem(
      chuvaMessage,
      `Lista da semana limpa com sucesso. Registros removidos: ${resultado.registrosRemovidos}.`,
      "success"
    );

    await carregarChuvaEstrelas();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      chuvaMessage,
      `Erro ao limpar lista: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    limparSemanaBtn.disabled = false;
    limparSemanaBtn.textContent = "Limpar lista da semana";
  }
});

carregarChuvaEstrelas();