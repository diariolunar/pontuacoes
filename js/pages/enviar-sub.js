import {
  registrarPontuacaoSub
} from "../services/pontuacoes.service.js";

import {
  converterPontuacao,
  escaparHtml,
  gerarSemanaAtual,
  mostrarMensagem,
  normalizarUser
} from "../core/utils.js";

const subForm = document.getElementById("subForm");
const membersList = document.getElementById("membersList");
const addMemberBtn = document.getElementById("addMemberBtn");
const lerFichaBtn = document.getElementById("lerFichaBtn");
const subMessage = document.getElementById("subMessage");
const submitBtn = subForm.querySelector('button[type="submit"]');

const mapaSubs = [
  {
    codigo: "A-1",
    valor: "A-1 Chama Eterna",
    desativado: false,
    chaves: ["chama eterna"]
  },
  {
    codigo: "A-2",
    valor: "A-2 Página Livre",
    desativado: false,
    chaves: ["pagina livre", "página livre"]
  },
  {
    codigo: "A-3",
    valor: "A-3 Entre Nós",
    desativado: false,
    chaves: ["entre nos", "entre nós"]
  },
  {
    codigo: "A-4",
    valor: "A-4 Sussurros da Aurora",
    desativado: false,
    chaves: ["sussurros da aurora"]
  },
  {
    codigo: "A-5",
    valor: "A-5 Crepúsculo",
    desativado: false,
    chaves: ["crepusculo", "crepúsculo"]
  },
  {
    codigo: "A-6",
    valor: "A-6 Trono Profano",
    desativado: false,
    chaves: ["trono profano"]
  },
  {
    codigo: "A-7",
    valor: "A-7 Margens de Mundos",
    desativado: false,
    chaves: ["margens de mundos"]
  },
  {
    codigo: "A-8",
    valor: "A-8 Ordem do Eclipse",
    desativado: false,
    chaves: ["ordem do eclipse"]
  },
  {
    codigo: "A-9",
    valor: "A-9 Cicatrizes Literárias",
    desativado: false,
    chaves: ["cicatrizes literarias", "cicatrizes literárias"]
  },
  {
    codigo: "A-10",
    valor: "A-10 Quasar",
    desativado: false,
    chaves: ["quasar"]
  },
  {
    codigo: "A-11",
    valor: "A-11 DESATIVADO",
    desativado: true,
    chaves: []
  },
  {
    codigo: "A-12",
    valor: "A-12 Estrela Polar",
    desativado: false,
    chaves: ["estrela polar"]
  },
  {
    codigo: "A-13",
    valor: "A-13 Luar Profano",
    desativado: false,
    chaves: ["luar profano"]
  },
  {
    codigo: "A-14",
    valor: "A-14 Fragmentos da Noite",
    desativado: false,
    chaves: ["fragmentos da noite"]
  },
  {
    codigo: "A-15",
    valor: "A-15 Véu Escarlate",
    desativado: false,
    chaves: ["veu escarlate", "véu escarlate"]
  }
];

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairValor(linha) {
  const partes = String(linha || "").split(":");

  if (partes.length < 2) return "";

  return partes.slice(1).join(":").trim();
}

function linhaTemCampo(linha, campo) {
  const linhaNormalizada = normalizarTexto(linha);
  const regex = new RegExp(`${campo}\\s*\\.?\\s*:`, "i");

  return regex.test(linhaNormalizada);
}

function linhaEhFinalDeFicha(linha) {
  const texto = normalizarTexto(linha);

  return (
    texto.startsWith("adm:") ||
    texto.startsWith("adm ") ||
    texto.includes("nao esta incluso leitura lunar") ||
    texto.includes("não está incluso leitura lunar") ||
    texto.includes("proj lunar") ||
    texto.includes("proj. lunar") ||
    texto.includes("projeto lunar") ||
    texto.includes("atencao") ||
    texto.includes("atenção") ||
    texto.includes("vamos manter") ||
    texto.includes("obrigada pela cooperacao") ||
    texto.includes("obrigada pela cooperação")
  );
}

function criarRegexCodigoSub(codigo) {
  const numero = codigo.toUpperCase().replace("A-", "");

  return new RegExp(`(^|[^a-zA-Z0-9])a\\s*-?\\s*${numero}([^0-9]|$)`, "i");
}

function reconhecerSubPorNome(texto) {
  const textoNormalizado = normalizarTexto(texto);

  const trechoInicial = textoNormalizado
    .split(/\r?\n/)
    .slice(0, 18)
    .join(" ");

  for (const sub of mapaSubs) {
    const encontrouNoInicio = sub.chaves.some((chave) => {
      return trechoInicial.includes(normalizarTexto(chave));
    });

    if (encontrouNoInicio) {
      return sub;
    }
  }

  for (const sub of mapaSubs) {
    const encontrouNoTexto = sub.chaves.some((chave) => {
      return textoNormalizado.includes(normalizarTexto(chave));
    });

    if (encontrouNoTexto) {
      return sub;
    }
  }

  return null;
}

function reconhecerSubPorCodigo(texto) {
  const textoNormalizado = normalizarTexto(texto);

  const trechoInicial = textoNormalizado
    .split(/\r?\n/)
    .slice(0, 18)
    .join(" ");

  const subsOrdenados = [...mapaSubs].sort((a, b) => {
    return Number(b.codigo.replace("A-", "")) - Number(a.codigo.replace("A-", ""));
  });

  for (const sub of subsOrdenados) {
    const regex = criarRegexCodigoSub(sub.codigo);

    if (regex.test(trechoInicial)) {
      return sub;
    }
  }

  for (const sub of subsOrdenados) {
    const regex = criarRegexCodigoSub(sub.codigo);

    if (regex.test(textoNormalizado)) {
      return sub;
    }
  }

  return null;
}

function reconhecerSub(texto) {
  return reconhecerSubPorNome(texto) || reconhecerSubPorCodigo(texto);
}

function preencherSubAutomaticamente(texto) {
  const subReconhecido = reconhecerSub(texto);
  const campoSub = document.getElementById("subNome");

  if (!subReconhecido || !campoSub) {
    return null;
  }

  if (subReconhecido.desativado) {
    return subReconhecido;
  }

  campoSub.value = subReconhecido.valor;

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
      value="${escaparHtml(membro.nome || "")}"
    />

    <input 
      type="text" 
      class="member-user" 
      placeholder="@user" 
      required 
      value="${escaparHtml(membro.user || "")}"
    />

    <input 
      type="number" 
      class="member-points" 
      placeholder="Pontos" 
      required
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
      return membro.nome && membro.user && !Number.isNaN(Number(membro.pontos));
    });
}

function separarBlocosDeMembros(texto) {
  const linhas = texto.split(/\r?\n/);
  const blocos = [];
  let blocoAtual = [];

  for (const linhaOriginal of linhas) {
    if (linhaEhFinalDeFicha(linhaOriginal)) {
      if (blocoAtual.length > 0) {
        blocos.push(blocoAtual.join("\n"));
      }

      blocoAtual = [];
      continue;
    }

    const ehLinhaDeNome = linhaTemCampo(linhaOriginal, "nome");

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

function extrairPontosDasObservacoes(bloco) {
  const matches = String(bloco || "").match(/-\s*\d+/g);

  if (!matches) {
    return 0;
  }

  return matches.reduce((total, item) => {
    return total + converterPontuacao(item);
  }, 0);
}

function extrairMembroDoBloco(bloco) {
  const linhas = bloco.split(/\r?\n/);

  let nome = "";
  let user = "";
  let pontos = null;

  for (const linhaOriginal of linhas) {
    if (linhaEhFinalDeFicha(linhaOriginal)) {
      break;
    }

    if (linhaTemCampo(linhaOriginal, "nome")) {
      nome = extrairValor(linhaOriginal);
      continue;
    }

    if (linhaTemCampo(linhaOriginal, "user")) {
      user = normalizarUser(extrairValor(linhaOriginal));
      continue;
    }

    if (linhaTemCampo(linhaOriginal, "pontos")) {
      const valorExtraido = extrairValor(linhaOriginal);

      if (valorExtraido !== "") {
        pontos = converterPontuacao(valorExtraido);
      }
    }
  }

  if (pontos === null) {
    pontos = extrairPontosDasObservacoes(bloco);
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

  if (subReconhecido?.desativado) {
    membersList.innerHTML = "";

    mostrarMensagem(
      subMessage,
      `${subReconhecido.valor.replace("DESATIVADO", "").trim()} está desativado no momento. O envio dessa ficha não está liberado.`,
      "error"
    );

    return;
  }

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

  const semanaAtual = gerarSemanaAtual();

  if (subReconhecido) {
    mostrarMensagem(
      subMessage,
      `${membros.length} membro(s) encontrado(s). Sub reconhecido: ${subReconhecido.valor}. Semana registrada automaticamente: ${semanaAtual}. Confira os dados antes de enviar.`,
      "success"
    );
  } else {
    mostrarMensagem(
      subMessage,
      `${membros.length} membro(s) encontrado(s), mas não consegui reconhecer o sub. Selecione o sub manualmente antes de enviar. Semana registrada automaticamente: ${semanaAtual}.`,
      "error"
    );
  }
});

subForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const sub = document.getElementById("subNome").value;
  const membros = coletarMembros();
  const semana = gerarSemanaAtual();

  if (!sub) {
    mostrarMensagem(
      subMessage,
      "Selecione o sub antes de enviar a pontuação.",
      "error"
    );

    return;
  }

  if (sub.includes("DESATIVADO")) {
    mostrarMensagem(
      subMessage,
      "Esse sub está desativado no momento. O envio de pontuação não está liberado.",
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
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    mostrarMensagem(
      subMessage,
      "Enviando pontuação para o Firebase...",
      "success"
    );

    await registrarPontuacaoSub({
      sub,
      semana,
      membros
    });

    mostrarMensagem(
      subMessage,
      `Pontuação enviada com sucesso! Semana registrada: ${semana}.`,
      "success"
    );

    subForm.reset();
    membersList.innerHTML = "";
  } catch (erro) {
    console.error("Erro ao enviar pontuação:", erro);

    mostrarMensagem(
      subMessage,
      `Erro ao enviar pontuação: ${erro.message || "verifique o Firebase e as regras do Firestore."}`,
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar pontuação";
  }
});
