import {
  buscarMembroPorUser
} from "../services/membros.service.js";

import {
  registrarComprasLojaLunar
} from "../services/pontuacoes.service.js";

import {
  confirmarModal,
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

let comprasPreparadas = [];

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
  comprasPreparadas = [];

  compraBox.innerHTML = `
    <div class="list-item">
      Nenhuma compra lida ainda.
    </div>
  `;
}

function renderizarCompras(compras) {
  compraBox.innerHTML = compras.map((compra) => `
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
  `).join("");
}

function criarCompraVazia() {
  return {
    nome: "",
    user: "",
    pontos: 0,
    compra: ""
  };
}

function lerFichasLoja(texto) {
  const linhas = String(texto || "")
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const compras = [];
  let compraAtual = criarCompraVazia();

  for (const linha of linhas) {
    if (linhaTemCampo(linha, "nome")) {
      if (compraAtual.nome || compraAtual.user || compraAtual.pontos || compraAtual.compra) {
        compras.push(compraAtual);
        compraAtual = criarCompraVazia();
      }

      compraAtual.nome = extrairValor(linha);
      continue;
    }

    if (linhaTemCampo(linha, "user")) {
      compraAtual.user = normalizarUser(extrairValor(linha));
      continue;
    }

    if (linhaTemCampo(linha, "pontos")) {
      compraAtual.pontos = Math.abs(converterPontuacao(extrairValor(linha)));
      continue;
    }

    if (linhaTemCampo(linha, "compra") || linhaTemCampo(linha, "motivo")) {
      compraAtual.compra = extrairValor(linha);
    }
  }

  if (compraAtual.nome || compraAtual.user || compraAtual.pontos || compraAtual.compra) {
    compras.push(compraAtual);
  }

  return compras;
}

function juntarTextosCompra(textoAtual, novoTexto) {
  return [textoAtual, novoTexto]
    .map((texto) => String(texto || "").trim())
    .filter(Boolean)
    .join(" | ");
}

function consolidarComprasPorUser(compras) {
  const comprasPorUser = new Map();

  for (const compra of compras) {
    const user = normalizarUser(compra.user);
    const compraExistente = comprasPorUser.get(user);

    if (compraExistente) {
      compraExistente.pontos += Number(compra.pontos || 0);
      compraExistente.compra = juntarTextosCompra(compraExistente.compra, compra.compra);
      continue;
    }

    comprasPorUser.set(user, {
      ...compra,
      user,
      pontos: Number(compra.pontos || 0)
    });
  }

  return Array.from(comprasPorUser.values());
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

  const compras = lerFichasLoja(texto);
  const fichaInvalida = compras.find((compra) => !compra.nome || !compra.user || compra.pontos <= 0);

  if (!compras.length || fichaInvalida) {
    limparCompraPreparada();

    mostrarMensagem(
      lojaMessage,
      "Não consegui ler uma das fichas. Confira se todas possuem Nome, User e Pontos.",
      "error"
    );

    return;
  }

  try {
    lerFichaBtn.disabled = true;
    lerFichaBtn.textContent = "Verificando membro...";

    const membrosEncontrados = await Promise.all(
      compras.map((compra) => validarMembroExiste(compra.user))
    );
    const indiceNaoEncontrado = membrosEncontrados.findIndex((membro) => !membro);

    if (indiceNaoEncontrado !== -1) {
      const compra = compras[indiceNaoEncontrado];
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

    const comprasComMembros = compras.map((compra, indice) => {
      const membro = membrosEncontrados[indice];

      return {
        nome: membro.nome || compra.nome,
        user: membro.user || compra.user,
        pontos: compra.pontos,
        compra: compra.compra
      };
    });
    comprasPreparadas = consolidarComprasPorUser(comprasComMembros);

    renderizarCompras(comprasPreparadas);

    mostrarMensagem(
      lojaMessage,
      `${comprasPreparadas.length} ${comprasPreparadas.length === 1 ? "compra lida" : "compras lidas"} com sucesso. Confira os dados antes de registrar.`,
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

  if (!comprasPreparadas.length) {
    mostrarMensagem(
      lojaMessage,
      "Leia e valide ao menos uma ficha antes de registrar as compras.",
      "error"
    );

    return;
  }

  const quantidadePontos = comprasPreparadas.reduce((total, compra) => total + Number(compra.pontos || 0), 0);
  const pontosTexto = `${quantidadePontos} ${quantidadePontos === 1 ? "ponto" : "pontos"}`;

  const confirmar = await confirmarModal({
    titulo: "Confirmar compras",
    texto: `Confirmar o registro de ${comprasPreparadas.length} ${comprasPreparadas.length === 1 ? "compra" : "compras"}?\n\nSerão removidos ${pontosTexto}.`,
    tipo: "warning",
    textoConfirmar: "Registrar compras",
    textoCancelar: "Cancelar"
  });

  if (!confirmar) {
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Registrando...";

    await registrarComprasLojaLunar({
      semana: gerarSemanaAtual(),
      compras: comprasPreparadas
    });

    mostrarMensagem(
      lojaMessage,
      `${comprasPreparadas.length} ${comprasPreparadas.length === 1 ? "compra registrada" : "compras registradas"} com sucesso. Os pontos foram removidos da Pontuação Geral.`,
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
    submitBtn.textContent = "Registrar compras";
  }
});

fecharModalBtn.addEventListener("click", () => {
  fecharModalErro();
});

limparCompraPreparada();
