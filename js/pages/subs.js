import {
  listarEnviosSubs
} from "../services/pontuacoes.service.js";

import {
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem
} from "../core/utils.js";

import {
  protegerPagina,
  configurarBotaoLogout
} from "../core/auth.js";

protegerPagina();
configurarBotaoLogout();

const subsLista = document.getElementById("subsLista");
const subsMessage = document.getElementById("subsMessage");
const semanaAtualTexto = document.getElementById("semanaAtualTexto");
const totalSubsTexto = document.getElementById("totalSubsTexto");

const subs = [
  {
    nome: "A-1 Chama Eterna",
    titulo: "A-1 - Chama Eterna",
    desativado: false
  },
  {
    nome: "A-2 Página Livre",
    titulo: "A-2 - Página Livre",
    desativado: false
  },
  {
    nome: "A-3 Entre Nós",
    titulo: "A-3 - Entre Nós",
    desativado: false
  },
  {
    nome: "A-4 Sussurros da Aurora",
    titulo: "A-4 - Sussurros da Aurora",
    desativado: false
  },
  {
    nome: "A-5 Crepúsculo",
    titulo: "A-5 - Crepúsculo",
    desativado: false
  },
  {
    nome: "A-6 Trono Profano",
    titulo: "A-6 - Trono Profano",
    desativado: false
  },
  {
    nome: "A-7 DESATIVADO",
    titulo: "A-7 - Desativado no momento",
    desativado: true
  },
  {
    nome: "A-8 Ordem do Eclipse",
    titulo: "A-8 - Ordem do Eclipse",
    desativado: false
  },
  {
    nome: "A-9 Cicatrizes Literárias",
    titulo: "A-9 - Cicatrizes Literárias",
    desativado: false
  },
  {
    nome: "A-10 Quasar",
    titulo: "A-10 - Quasar",
    desativado: false
  },
  {
    nome: "A-11 DESATIVADO",
    titulo: "A-11 - Desativado no momento",
    desativado: true
  },
  {
    nome: "A-12 Estrela Polar",
    titulo: "A-12 - Estrela Polar",
    desativado: false
  },
  {
    nome: "A-13 Luar Profano",
    titulo: "A-13 - Luar Profano",
    desativado: false
  },
  {
    nome: "A-14 Fragmentos da Noite",
    titulo: "A-14 - Fragmentos da Noite",
    desativado: false
  },
  {
    nome: "A-15 Véu Escarlate",
    titulo: "A-15 - Véu Escarlate",
    desativado: false
  }
];

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

async function carregarSubs() {
  const semanaAtual = gerarSemanaAtual();

  semanaAtualTexto.textContent = `Semana atual: ${semanaAtual}`;

  try {
    const envios = await listarEnviosSubs(semanaAtual);
    const subsAtivos = subs.filter((sub) => !sub.desativado);
    const subsEnviados = subsAtivos.filter((sub) => contarEnviosDoSub(envios, sub.nome) > 0);

    totalSubsTexto.textContent = `Subs enviados: ${subsEnviados.length} de ${subsAtivos.length}`;

    subsLista.innerHTML = subs
      .map((sub) => criarCardSub(sub, envios))
      .join("");

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

carregarSubs();
