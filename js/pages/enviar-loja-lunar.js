import {
  buscarMembroPorUser
} from "../services/membros.service.js";

import {
  registrarCompraLojaLunar
} from "../services/pontuacoes.service.js";

import {
  converterPontuacao,
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

const lojaForm = document.getElementById("lojaForm");
const fichaTexto = document.getElementById("fichaTexto");
const lerFichaBtn = document.getElementById("lerFichaBtn");
const compraBox = document.getElementById("compraBox");
const lojaMessage = document.getElementById("lojaMessage");
const submitBtn = lojaForm.querySelector('button[type="submit"]');

const erroModal = document.getElementById("erroModal");
const erroModalTexto = document.getElementById("erroModalTexto");
const fecharModalBtn = document.getElementById("fecharModalBtn");

let compraPreparada = null;

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extrairValor(linha) {
  const partes = String(linha || "").split(":");

  if (partes.length < 2) {
    return "";
  }

  return partes.slice(1).join(":").trim();
}

function linhaTemCampo(linha, campo) {
  const linhaNormalizada = normalizarTexto(linha);
  const regex = new RegExp(`^${campo}\\s*\\.?\\s*:`, "i");

  return regex.test(linhaNormalizada);
}

function abrirModalErro(texto) {
  erroModalTexto.textContent = texto;

  if (typeof erroModal.showModal === "function") {
    erroModal.showModal();
    return;
  }

  window.alert(texto);
}

function fecharModalErro() {
  if (erroModal.open) {
    erroModal.close();
  }
}

function limparCompraPreparada() {
  compraPreparada = null;

  compraBox.innerHTML = `
    <div class="list-item">
      Nenhuma compra lida ainda.
    </div>
  `;
}

function renderizarCompra(compra) {
  compraBox.innerHTML = `
    <article class="member-admin-card member-list-card">
      <div class="member-admin-header">
        <div>
          <h2>${escaparHtml(compra.nome)}</h2>
          <p>${escaparHtml(compra.user)}</p>
        </div>
      </div>

      <div class="point-card-content">
        <div class="point-card-header">
          <strong>-${Math.abs(Number(compra.pontos || 0))} pts</strong>
        </div>

        <div class="point-breakdown">
          <span>Compra: ${escaparHtml(compra.compra || "Não informada")}</span>
        </div>
      </div>
    </article>
  `;
}

function lerFichaLoja(texto) {
  const linhas = String(texto || "")
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  let nome = "";
  let user = "";
  let pontos = 0;
  let compra = "";

  for (const linha of linhas) {
    if (linhaTemCampo(linha, "nome")) {
      nome = extrairValor(linha);
      continue;
    }

    if (linhaTemCampo(linha, "user")) {
      user = normalizarUser(extrairValor(linha));
      continue;
    }

    if (linhaTemCampo(linha, "pontos")) {
      pontos = Math.abs(converterPontuacao(extrairValor(linha)));
      continue;
    }

    if (linhaTemCampo(linha, "compra")) {
      compra = extrairValor(linha);
    }
  }

  return {
    nome,
    user,
    pontos,
    compra
  };
}

async function validarMembroExiste(user) {
  const membro = await buscarMembroPorUser(user);

  return membro;
}

lerFichaBtn.addEventListener("click", async () => {
  const texto = fichaTexto.value.trim();

  if (!texto) {
    limparCompraPreparada();

    mostrarMensagem(
      lojaMessage,
      "Cole a ficha da compra antes de tentar ler automaticamente.",
      "error"
    );

    return;
  }

  const compra = lerFichaLoja(texto);

  if (!compra.nome || !compra.user || compra.pontos <= 0) {
    limparCompraPreparada();

    mostrarMensagem(
      lojaMessage,
      "Não consegui ler a ficha. Confira se ela possui Nome, User e Pontos.",
      "error"
    );

    return;
  }

  try {
    lerFichaBtn.disabled = true;
    lerFichaBtn.textContent = "Verificando membro...";

    const membroEncontrado = await validarMembroExiste(compra.user);

    if (!membroEncontrado) {
      limparCompraPreparada();

      abrirModalErro(
        `O usuário ${compra.user} não foi encontrado no cadastro de membros. A compra não foi registrada e nenhum ponto foi removido.`
      );

      mostrarMensagem(
        lojaMessage,
        "Compra não registrada. Usuário não encontrado no cadastro.",
        "error"
      );

      return;
    }

    compraPreparada = {
      nome: membroEncontrado.nome || compra.nome,
      user: membroEncontrado.user || compra.user,
      pontos: compra.pontos,
      compra: compra.compra
    };

    renderizarCompra(compraPreparada);

    mostrarMensagem(
      lojaMessage,
      "Compra lida com sucesso. Confira os dados antes de registrar.",
      "success"
    );
  } catch (erro) {
    console.error(erro);

    limparCompraPreparada();

    mostrarMensagem(
      lojaMessage,
      "Erro ao verificar membro. Tente novamente.",
      "error"
    );
  } finally {
    lerFichaBtn.disabled = false;
    lerFichaBtn.textContent = "Ler ficha automaticamente";
  }
});

lojaForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!compraPreparada) {
    mostrarMensagem(
      lojaMessage,
      "Leia e valide uma ficha antes de registrar a compra.",
      "error"
    );

    return;
  }

  const confirmar = window.confirm(
    `Confirmar compra de ${compraPreparada.nome} (${compraPreparada.user})?\n\nSerão removidos ${compraPreparada.pontos} pontos.`
  );

  if (!confirmar) {
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Registrando...";

    await registrarCompraLojaLunar({
      semana: gerarSemanaAtual(),
      nome: compraPreparada.nome,
      user: compraPreparada.user,
      pontos: compraPreparada.pontos,
      compra: compraPreparada.compra
    });

    mostrarMensagem(
      lojaMessage,
      "Compra registrada com sucesso. Os pontos foram removidos da Pontuação Geral.",
      "success"
    );

    lojaForm.reset();
    limparCompraPreparada();
  } catch (erro) {
    console.error(erro);

    if (erro.code === "membro-nao-encontrado") {
      abrirModalErro(
        `O usuário ${erro.user || ""} não foi encontrado no cadastro de membros. A compra não foi registrada e nenhum ponto foi removido.`
      );
    }

    mostrarMensagem(
      lojaMessage,
      `Erro ao registrar compra: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Registrar compra";
  }
});

fecharModalBtn.addEventListener("click", () => {
  fecharModalErro();
});

limparCompraPreparada();