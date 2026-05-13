import {
  registrarPontuacaoSub
} from "../services/pontuacoes.service.js";

import {
  converterPontuacao,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

const subForm = document.getElementById("subForm");
const membersList = document.getElementById("membersList");
const addMemberBtn = document.getElementById("addMemberBtn");
const subMessage = document.getElementById("subMessage");

function criarLinhaMembro() {
  const linha = document.createElement("div");

  linha.className = "member-row";

  linha.innerHTML = `
    <input type="text" class="member-name" placeholder="Nome do membro" required />
    <input type="text" class="member-user" placeholder="@user" required />
    <input type="number" class="member-points" placeholder="Pontos" required min="0" />
    <button type="button" class="remove-member">×</button>
  `;

  const removeBtn = linha.querySelector(".remove-member");

  removeBtn.addEventListener("click", () => {
    linha.remove();
  });

  membersList.appendChild(linha);
}

function coletarMembros() {
  const linhas = document.querySelectorAll(".member-row");

  return Array.from(linhas)
    .map((linha) => {
      const nome = linha.querySelector(".member-name").value.trim();
      const user = normalizarUser(linha.querySelector(".member-user").value);
      const pontos = converterPontuacao(linha.querySelector(".member-points").value);

      return {
        nome,
        user,
        pontos
      };
    })
    .filter((membro) => {
      return membro.nome && membro.user && membro.pontos > 0;
    });
}

addMemberBtn.addEventListener("click", () => {
  criarLinhaMembro();
});

subForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const sub = document.getElementById("subNome").value;
  const codigoAdm = document.getElementById("codigoAdm").value.trim();
  const semana = document.getElementById("semana").value.trim();
  const membros = coletarMembros();

  if (membros.length === 0) {
    mostrarMensagem(
      subMessage,
      "Adicione pelo menos um membro com nome, user e pontuação.",
      "error"
    );

    return;
  }

  try {
    await registrarPontuacaoSub({
      sub,
      codigoAdm,
      semana,
      membros
    });

    mostrarMensagem(
      subMessage,
      "Pontuação enviada com sucesso!",
      "success"
    );

    subForm.reset();
    membersList.innerHTML = "";
    criarLinhaMembro();
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      subMessage,
      "Erro ao enviar pontuação. Tente novamente.",
      "error"
    );
  }
});

criarLinhaMembro();
