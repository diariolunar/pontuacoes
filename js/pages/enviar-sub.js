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
const lerFichaBtn = document.getElementById("lerFichaBtn");
const subMessage = document.getElementById("subMessage");

const mapaSubs = [
  {
    valor: "A-1 Chama Eterna",
    chaves: ["a-1", "a1", "chama eterna"]
  },
  {
    valor: "A-2 Página Livre",
    chaves: ["a-2", "a2", "pagina livre", "página livre"]
  },
  {
    valor: "A-3",
    chaves: ["a-3", "a3"]
  },
  {
    valor: "A-4",
    chaves: ["a-4", "a4"]
  },
  {
    valor: "A-5",
    chaves: ["a-5", "a5"]
  },
  {
    valor: "A-6 Trono Profano",
    chaves: ["a-6", "a6", "trono profano"]
  },
  {
    valor: "A-7",
    chaves: ["a-7", "a7"]
  },
  {
    valor: "A-8",
    chaves: ["a-8", "a8"]
  },
  {
    valor: "A-9",
    chaves: ["a-9", "a9"]
  },
  {
    valor: "A-10",
    chaves: ["a-10", "a10"]
  },
  {
    valor: "A-11",
    chaves: ["a-11", "a11"]
  },
  {
    valor: "A-12",
    chaves: ["a-12", "a12"]
  },
  {
    valor: "A-13",
    chaves: ["a-13", "a13"]
  }
];

function normalizarTexto(texto) {
  return texto
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[—–]/g, "-")
    .replace(/[^\w\s@\-:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairValor(linha) {
  const partes = linha.split(":");

  if (partes.length < 2) return "";

  return partes.slice(1).join(":").trim();
}

function reconhecerSub(texto) {
  const textoNormalizado = normalizarTexto(texto);

  for (const sub of mapaSubs) {
    const encontrou = sub.chaves.some((chave) => {
      const chaveNormalizada = normalizarTexto(chave);
      return textoNormalizado.includes(chaveNormalizada);
    });

    if (encontrou) {
      return sub.valor;
    }
  }

  return "";
}

function preencherSubAutomaticamente(texto) {
  const subReconhecido = reconhecerSub(texto);
  const campoSub = document.getElementById("subNome");

  if (!subReconhecido || !campoSub) {
    return "";
  }

  campoSub.value = subReconhecido;

  return subReconhecido;
}

function criarLinhaMembro(membro = {}) {
  const linha = document.createElement("div");

  linha.className = "member-row";

  linha.innerHTML = `
    <input 
      type="text" 
      class="member-name" 
      placeholder="Nome do membro" 
      required 
      value="${membro.nome || ""}"
    />

    <input 
      type="text" 
      class="member-user" 
      placeholder="@user" 
      required 
      value="${membro.user || ""}"
    />

    <input 
      type="number" 
      class="member-points" 
      placeholder="Pontos" 
      required 
      min="0" 
      value="${membro.pontos ?? ""}"
    />

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
      return membro.nome && membro.user;
    });
}

function separarBlocosDeMembros(texto) {
  const linhas = texto.split(/\r?\n/);
  const blocos = [];
  let blocoAtual = [];

  for (const linhaOriginal of linhas) {
    const linhaNormalizada = normalizarTexto(linhaOriginal);

    const ehLinhaDeNome =
      linhaNormalizada.includes("nome:") ||
      linhaNormalizada.includes("nome :");

    if (ehLinhaDeNome) {
      if (blocoAtual.length > 0) {
        blocos.push(blocoAtual.join("\n"));
      }

      blocoAtual = [linhaOriginal];
      continue;
    }

    if (blocoAtual.length > 0) {
      blocoAtual.push(linhaOriginal);
    }
  }

  if (blocoAtual.length > 0) {
    blocos.push(blocoAtual.join("\n"));
  }

  return blocos;
}

function extrairMembroDoBloco(bloco) {
  const linhas = bloco.split(/\r?\n/);

  let nome = "";
  let user = "";
  let pontos = 0;

  for (const linhaOriginal of linhas) {
    const linhaNormalizada = normalizarTexto(linhaOriginal);

    if (linhaNormalizada.includes("nome:") || linhaNormalizada.includes("nome :")) {
      nome = extrairValor(linhaOriginal);
    }

    if (linhaNormalizada.includes("user:") || linhaNormalizada.includes("user :")) {
      user = normalizarUser(extrairValor(linhaOriginal));
    }

    if (linhaNormalizada.includes("pontos:") || linhaNormalizada.includes("pontos :")) {
      pontos = converterPontuacao(extrairValor(linhaOriginal));
    }
  }

  if (!nome || !user) {
    return null;
  }

  return {
    nome,
    user,
    pontos
  };
}

function lerFichaCompleta(texto) {
  const blocos = separarBlocosDeMembros(texto);

  return blocos
    .map((bloco) => extrairMembroDoBloco(bloco))
    .filter(Boolean);
}

addMemberBtn.addEventListener("click", () => {
  criarLinhaMembro();
});

lerFichaBtn.addEventListener("click", () => {
  const fichaTexto = document.getElementById("fichaTexto").value.trim();

  if (!fichaTexto) {
    mostrarMensagem(
      subMessage,
      "Cole a ficha completa antes de tentar ler automaticamente.",
      "error"
    );

    return;
  }

  const subReconhecido = preencherSubAutomaticamente(fichaTexto);
  const membros = lerFichaCompleta(fichaTexto);

  if (membros.length === 0) {
    mostrarMensagem(
      subMessage,
      "Não consegui encontrar membros na ficha. Confira se ela possui Nome, User e Pontos.",
      "error"
    );

    return;
  }

  membersList.innerHTML = "";

  membros.forEach((membro) => {
    criarLinhaMembro(membro);
  });

  if (subReconhecido) {
    mostrarMensagem(
      subMessage,
      `${membros.length} membro(s) encontrado(s). Sub reconhecido: ${subReconhecido}. Confira os dados antes de enviar.`,
      "success"
    );
  } else {
    mostrarMensagem(
      subMessage,
      `${membros.length} membro(s) encontrado(s), mas não consegui reconhecer o sub. Selecione o sub manualmente antes de enviar.`,
      "error"
    );
  }
});

subForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const sub = document.getElementById("subNome").value;
  const codigoAdm = document.getElementById("codigoAdm").value.trim();
  const semana = document.getElementById("semana").value.trim();
  const membros = coletarMembros();

  if (!sub) {
    mostrarMensagem(
      subMessage,
      "Selecione o sub antes de enviar a pontuação.",
      "error"
    );

    return;
  }

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
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      subMessage,
      "Erro ao enviar pontuação. Tente novamente.",
      "error"
    );
  }
});
