import {
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
const leituraTabela = document.getElementById("leituraTabela");
const leituraMessage = document.getElementById("leituraMessage");

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
    leituraTabela.innerHTML = `
      <tr>
        <td colspan="3">Nenhum membro registrado na Leitura Lunar desta semana.</td>
      </tr>
    `;

    return;
  }

  leituraTabela.innerHTML = membros
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

async function carregarLeituraLunar() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  try {
    await configurarMenuPorPermissao();

    const registros = await listarPontuacoesCategoria({
      colecao: "leituraLunar",
      semana: semanaAtual
    });

    const membros = agruparPorUser(registros);

    renderizarTabela(membros);

    leituraMessage.textContent = "";
    leituraMessage.className = "message";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      leituraMessage,
      "Erro ao carregar a Leitura Lunar. Tente novamente.",
      "error"
    );
  }
}

carregarLeituraLunar();
