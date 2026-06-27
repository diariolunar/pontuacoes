import {
  listarEnviosSubs
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

import {
  SUBS_OFICIAIS,
  obterTituloSub
} from "../core/subs.js";

protegerPagina();
configurarBotaoLogout();

const filtroSemana = document.getElementById("filtroSemana");
const filtroSub = document.getElementById("filtroSub");
const limparFiltroBtn = document.getElementById("limparFiltroBtn");
const resumoSemanaBox = document.getElementById("resumoSemanaBox");
const fichasLista = document.getElementById("fichasLista");
const fichasMessage = document.getElementById("fichasMessage");
const totalFichasTexto = document.getElementById("totalFichasTexto");

let fichasCarregadas = [];

const subsOficiais = SUBS_OFICIAIS;

function formatarData(timestamp) {
  if (!timestamp?.seconds) {
    return "Data não registrada";
  }

  const data = new Date(timestamp.seconds * 1000);

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function ordenarSemanas(semanas) {
  return [...semanas].sort((a, b) => {
    const inicioA = obterDataInicioSemana(a)?.getTime() || 0;
    const inicioB = obterDataInicioSemana(b)?.getTime() || 0;

    return inicioB - inicioA;
  });
}

function converterDataPtBrParaDate(dataTexto) {
  const partes = String(dataTexto || "").trim().split("/");

  if (partes.length !== 3) {
    return null;
  }

  const dia = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const ano = Number(partes[2]);

  if (!dia || Number.isNaN(mes) || !ano) {
    return null;
  }

  return new Date(ano, mes, dia);
}

function obterDataInicioSemana(semana) {
  const partes = String(semana || "").split(" a ");

  if (partes.length !== 2) {
    return null;
  }

  return converterDataPtBrParaDate(partes[0]);
}

function preencherFiltroSemanas(fichas) {
  const semanas = new Set();

  for (const ficha of fichas) {
    if (ficha.semana) {
      semanas.add(ficha.semana);
    }
  }

  const semanaAtual = gerarSemanaAtual();

  if (semanaAtual) {
    semanas.add(semanaAtual);
  }

  const semanasOrdenadas = ordenarSemanas(Array.from(semanas));

  filtroSemana.innerHTML = `
    <option value="">Todas as semanas</option>
    ${semanasOrdenadas
      .map((semana) => {
        return `
          <option value="${escaparHtml(semana)}">
            ${escaparHtml(semana)}
          </option>
        `;
      })
      .join("")}
  `;

  filtroSemana.value = semanaAtual;
}

function criarCardFicha(ficha) {
  const textoFicha = ficha.fichaOriginal || ficha.fichaTexto || "";

  return `
    <article class="list-item">
      <strong>${escaparHtml(obterTituloSub(ficha.sub))}</strong><br>
      Semana: ${escaparHtml(ficha.semana || "Não informada")}<br>
      Membros encontrados: ${Number(ficha.totalMembros || 0)}<br>
      Enviada em: ${escaparHtml(formatarData(ficha.criadoEm))}

      <details class="point-details" style="margin-top: 12px;">
        <summary>Ver ficha enviada</summary>

        <pre style="
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          background: rgba(7, 0, 15, 0.55);
          border: 1px solid rgba(155, 53, 217, 0.25);
          border-radius: 14px;
          padding: 14px;
          color: #f7efff;
          line-height: 1.45;
          margin-top: 12px;
          max-height: 420px;
          overflow: auto;
        ">${escaparHtml(textoFicha || "Ficha original não salva para este envio antigo.")}</pre>
      </details>
    </article>
  `;
}

function obterFichasFiltradas() {
  const semanaSelecionada = filtroSemana.value;
  const subSelecionado = filtroSub.value;

  return fichasCarregadas.filter((ficha) => {
    const bateSemana = !semanaSelecionada || ficha.semana === semanaSelecionada;
    const bateSub = !subSelecionado || ficha.sub === subSelecionado;

    return bateSemana && bateSub;
  });
}

function obterSubsEnviadosNaSemana(semana) {
  const enviados = new Set();

  for (const ficha of fichasCarregadas) {
    if (ficha.semana !== semana) {
      continue;
    }

    if (ficha.sub) {
      enviados.add(ficha.sub);
    }
  }

  return enviados;
}

function renderizarResumoSemana() {
  const semanaSelecionada = filtroSemana.value;

  if (!semanaSelecionada) {
    resumoSemanaBox.innerHTML = `
      <div class="list-item">
        Selecione uma semana para ver quais subs enviaram e quais ficaram pendentes.
      </div>
    `;

    return;
  }

  const enviados = obterSubsEnviadosNaSemana(semanaSelecionada);

  const subsEnviados = subsOficiais.filter((sub) => enviados.has(sub.nome));
  const subsPendentes = subsOficiais.filter((sub) => !enviados.has(sub.nome));

  resumoSemanaBox.innerHTML = `
    <div class="list-item">
      <strong>Semana:</strong> ${escaparHtml(semanaSelecionada)}<br>
      <strong>Subs enviados:</strong> ${subsEnviados.length} de ${subsOficiais.length}<br>
      <strong>Subs pendentes:</strong> ${subsPendentes.length}
    </div>

    <div class="list-item">
      <strong>✅ Enviaram</strong><br>
      ${
        subsEnviados.length > 0
          ? subsEnviados.map((sub) => escaparHtml(sub.titulo)).join("<br>")
          : "Nenhum sub enviou ficha nesta semana."
      }
    </div>

    <div class="list-item">
      <strong>⏳ Pendentes</strong><br>
      ${
        subsPendentes.length > 0
          ? subsPendentes.map((sub) => escaparHtml(sub.titulo)).join("<br>")
          : "Todos os subs enviaram ficha nesta semana."
      }
    </div>
  `;
}

function renderizarFichas(lista) {
  totalFichasTexto.textContent = `Fichas encontradas: ${lista.length}`;

  if (lista.length === 0) {
    fichasLista.innerHTML = "";

    mostrarMensagem(
      fichasMessage,
      "Nenhuma ficha encontrada com esse filtro.",
      "error"
    );

    return;
  }

  fichasMessage.textContent = "";
  fichasMessage.className = "message";

  fichasLista.innerHTML = lista
    .map((ficha) => criarCardFicha(ficha))
    .join("");
}

function aplicarFiltros() {
  renderizarResumoSemana();

  const filtradas = obterFichasFiltradas();

  renderizarFichas(filtradas);
}

async function carregarFichas() {
  try {
    await configurarMenuPorPermissao();

    fichasCarregadas = await listarEnviosSubs();

    preencherFiltroSemanas(fichasCarregadas);

    aplicarFiltros();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      fichasMessage,
      "Erro ao carregar as fichas enviadas. Tente novamente.",
      "error"
    );
  }
}

filtroSemana.addEventListener("change", () => {
  aplicarFiltros();
});

filtroSub.addEventListener("change", () => {
  aplicarFiltros();
});

limparFiltroBtn.addEventListener("click", () => {
  filtroSemana.value = "";
  filtroSub.value = "";
  aplicarFiltros();
});

carregarFichas();
