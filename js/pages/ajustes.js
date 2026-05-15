import {
  listarAjustesManuais,
  registrarAjustesManuais
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
const adicionarAjusteIndividualBtn = document.getElementById("adicionarAjusteIndividualBtn");
const ajusteIndividualMessage = document.getElementById("ajusteIndividualMessage");

const listaAjustesTexto = document.getElementById("listaAjustesTexto");
const lerListaAjustesBtn = document.getElementById("lerListaAjustesBtn");
const ajustesPreparadosLista = document.getElementById("ajustesPreparadosLista");
const limparAjustesPreparadosBtn = document.getElementById("limparAjustesPreparadosBtn");
const salvarAjustesBtn = document.getElementById("salvarAjustesBtn");

const ajusteMessage = document.getElementById("ajusteMessage");
const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalAjustesTexto = document.getElementById("totalAjustesTexto");
const ajustesTabela = document.getElementById("ajustesTabela");

let ajustesPreparados = [];

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extrairValor(linha) {
  const partes = linha.split(":");

  if (partes.length < 2) return "";

  return partes.slice(1).join(":").trim();
}

function normalizarTipo(tipo) {
  const valor = normalizarTexto(tipo);

  if (
    valor.includes("remover") ||
    valor.includes("remocao") ||
    valor.includes("remoção") ||
    valor.includes("retirar") ||
    valor.includes("subtrair") ||
    valor === "-"
  ) {
    return "remover";
  }

  return "adicionar";
}

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

function criarCardAjustePreparado(ajuste, index) {
  return `
    <article class="member-admin-card member-list-card adjustment-card" data-index="${index}">
      <div class="member-admin-header">
        <div>
          <h2>${escaparHtml(ajuste.nome || "Sem nome")}</h2>
          <p>${escaparHtml(normalizarUser(ajuste.user || ""))}</p>
        </div>
      </div>

      <div class="member-edit-form member-list-form">
        <div class="field">
          <label>Tipo</label>
          <select class="prepared-tipo">
            <option value="adicionar" ${ajuste.tipo === "adicionar" ? "selected" : ""}>Adicionar</option>
            <option value="remover" ${ajuste.tipo === "remover" ? "selected" : ""}>Remover</option>
          </select>
        </div>

        <div class="field">
          <label>Pontos</label>
          <input type="number" class="prepared-pontos" min="1" value="${Math.abs(Number(ajuste.pontos || 0))}" />
        </div>

        <div class="field">
          <label>Motivo</label>
          <input type="text" class="prepared-motivo" value="${escaparHtml(ajuste.motivo || "")}" />
        </div>

        <div class="member-admin-actions">
          <button type="button" class="btn danger remover-ajuste-preparado-btn">
            Remover
          </button>
        </div>
      </div>
    </article>
  `;
}

function sincronizarAjustesPreparadosComTela() {
  const cards = document.querySelectorAll(".adjustment-card");

  cards.forEach((card) => {
    const index = Number(card.dataset.index);
    const tipo = card.querySelector(".prepared-tipo").value;
    const pontos = Number(card.querySelector(".prepared-pontos").value || 0);
    const motivo = card.querySelector(".prepared-motivo").value.trim();

    if (ajustesPreparados[index]) {
      ajustesPreparados[index].tipo = tipo;
      ajustesPreparados[index].pontos = pontos;
      ajustesPreparados[index].motivo = motivo;
    }
  });
}

function renderizarAjustesPreparados() {
  if (ajustesPreparados.length === 0) {
    ajustesPreparadosLista.innerHTML = `
      <div class="list-item">
        Nenhum ajuste preparado para envio.
      </div>
    `;

    return;
  }

  ajustesPreparadosLista.innerHTML = ajustesPreparados
    .map((ajuste, index) => criarCardAjustePreparado(ajuste, index))
    .join("");

  document.querySelectorAll(".remover-ajuste-preparado-btn").forEach((botao) => {
    botao.addEventListener("click", () => {
      const card = botao.closest(".adjustment-card");
      const index = Number(card.dataset.index);

      ajustesPreparados.splice(index, 1);
      renderizarAjustesPreparados();
    });
  });
}

function adicionarAjustePreparado(ajuste) {
  ajustesPreparados.push({
    nome: ajuste.nome.trim(),
    user: normalizarUser(ajuste.user),
    tipo: normalizarTipo(ajuste.tipo),
    pontos: Math.abs(Number(ajuste.pontos || 0)),
    motivo: ajuste.motivo.trim()
  });

  renderizarAjustesPreparados();
}

function lerFormatoLinhaSimples(texto) {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const ajustes = [];

  for (const linha of linhas) {
    let partes = [];

    if (linha.includes(" - ")) {
      partes = linha.split(" - ");
    } else if (linha.includes(" — ")) {
      partes = linha.split(" — ");
    } else if (linha.includes("|")) {
      partes = linha.split("|");
    } else if (linha.includes(";")) {
      partes = linha.split(";");
    } else if (linha.includes(",")) {
      partes = linha.split(",");
    }

    partes = partes.map((parte) => parte.trim()).filter(Boolean);

    if (partes.length >= 5) {
      ajustes.push({
        nome: partes[0],
        user: partes[1],
        tipo: normalizarTipo(partes[2]),
        pontos: Number(partes[3] || 0),
        motivo: partes.slice(4).join(" - ")
      });
    }
  }

  return ajustes.filter((ajuste) => {
    return ajuste.nome && ajuste.user && ajuste.pontos > 0 && ajuste.motivo;
  });
}

function lerFormatoBloco(texto) {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const ajustes = [];
  let atual = {
    nome: "",
    user: "",
    tipo: "adicionar",
    pontos: "",
    motivo: ""
  };

  function fecharAtual() {
    if (atual.nome && atual.user && atual.pontos && atual.motivo) {
      ajustes.push({
        nome: atual.nome,
        user: atual.user,
        tipo: normalizarTipo(atual.tipo),
        pontos: Number(atual.pontos || 0),
        motivo: atual.motivo
      });
    }

    atual = {
      nome: "",
      user: "",
      tipo: "adicionar",
      pontos: "",
      motivo: ""
    };
  }

  for (const linha of linhas) {
    const linhaNormalizada = normalizarTexto(linha);

    if (linhaNormalizada.startsWith("nome:")) {
      if (atual.nome || atual.user || atual.pontos || atual.motivo) {
        fecharAtual();
      }

      atual.nome = extrairValor(linha);
      continue;
    }

    if (linhaNormalizada.startsWith("user:")) {
      atual.user = extrairValor(linha);
      continue;
    }

    if (linhaNormalizada.startsWith("tipo:")) {
      atual.tipo = extrairValor(linha);
      continue;
    }

    if (linhaNormalizada.startsWith("pontos:")) {
      atual.pontos = extrairValor(linha);
      continue;
    }

    if (linhaNormalizada.startsWith("motivo:")) {
      atual.motivo = extrairValor(linha);
    }
  }

  fecharAtual();

  return ajustes.filter((ajuste) => ajuste.pontos > 0);
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

adicionarAjusteIndividualBtn.addEventListener("click", () => {
  const nome = nomeMembro.value.trim();
  const user = userMembro.value.trim();
  const tipo = tipoAjuste.value;
  const pontos = Number(pontosAjuste.value || 0);
  const motivo = motivoAjuste.value.trim();

  if (!nome || !user || !tipo || pontos <= 0 || !motivo) {
    mostrarMensagem(
      ajusteIndividualMessage,
      "Preencha nome, user, tipo, pontos e motivo antes de adicionar.",
      "error"
    );

    return;
  }

  adicionarAjustePreparado({
    nome,
    user,
    tipo,
    pontos,
    motivo
  });

  ajusteForm.reset();

  mostrarMensagem(
    ajusteIndividualMessage,
    "Ajuste individual adicionado à lista de envio.",
    "success"
  );
});

lerListaAjustesBtn.addEventListener("click", () => {
  const texto = listaAjustesTexto.value.trim();

  if (!texto) {
    mostrarMensagem(
      ajusteMessage,
      "Cole uma lista antes de tentar ler automaticamente.",
      "error"
    );

    return;
  }

  const ajustesLinha = lerFormatoLinhaSimples(texto);
  const ajustesBloco = lerFormatoBloco(texto);
  const ajustes = [...ajustesLinha, ...ajustesBloco];

  if (ajustes.length === 0) {
    mostrarMensagem(
      ajusteMessage,
      "Não consegui encontrar ajustes. Use: Nome - User - Tipo - Pontos - Motivo",
      "error"
    );

    return;
  }

  ajustes.forEach((ajuste) => adicionarAjustePreparado(ajuste));

  mostrarMensagem(
    ajusteMessage,
    `${ajustes.length} ajuste(s) preparado(s) para envio.`,
    "success"
  );
});

limparAjustesPreparadosBtn.addEventListener("click", () => {
  ajustesPreparados = [];
  renderizarAjustesPreparados();

  mostrarMensagem(
    ajusteMessage,
    "Lista de ajustes preparados limpa.",
    "success"
  );
});

salvarAjustesBtn.addEventListener("click", async () => {
  sincronizarAjustesPreparadosComTela();

  const ajustesValidos = ajustesPreparados.filter((ajuste) => {
    return ajuste.nome && ajuste.user && ajuste.tipo && ajuste.pontos > 0 && ajuste.motivo;
  });

  if (ajustesValidos.length === 0) {
    mostrarMensagem(
      ajusteMessage,
      "Nenhum ajuste válido preparado para envio.",
      "error"
    );

    return;
  }

  const confirmar = window.confirm(
    `Tem certeza que deseja salvar ${ajustesValidos.length} ajuste(s)?\n\nA Pontuação Geral será alterada imediatamente.`
  );

  if (!confirmar) {
    return;
  }

  try {
    salvarAjustesBtn.disabled = true;
    salvarAjustesBtn.textContent = "Salvando...";

    await registrarAjustesManuais({
      semana: gerarSemanaAtual(),
      ajustes: ajustesValidos
    });

    ajustesPreparados = [];
    renderizarAjustesPreparados();

    mostrarMensagem(
      ajusteMessage,
      "Ajustes manuais registrados com sucesso.",
      "success"
    );

    await carregarAjustes();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      ajusteMessage,
      `Erro ao salvar ajustes: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    salvarAjustesBtn.disabled = false;
    salvarAjustesBtn.textContent = "Salvar ajustes preparados";
  }
});

renderizarAjustesPreparados();
carregarAjustes();