import {
  auth,
  db
} from "../config/firebase.js";

import {
  configurarBotaoLogout,
  configurarMenuPorPermissao,
  protegerPagina
} from "../core/auth.js";

import {
  mostrarMensagem
} from "../core/utils.js";

import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

protegerPagina();
configurarBotaoLogout();

const SUPERADMIN_UID = "TYd7SwJ3PeUdxZvdaNLnoxaTjDd2";

const limparMovimentacoesBtn = document.getElementById("limparMovimentacoesBtn");
const limpezaMessage = document.getElementById("limpezaMessage");

const colecoesParaLimpar = [
  "historicoPontuacoes",
  "ajustesManuais"
];

const dataInicial = new Date("2026-05-18T00:00:00");

function usuarioAtualEhSuperadmin() {
  return auth.currentUser?.uid === SUPERADMIN_UID;
}

async function aguardarLogin() {
  return new Promise((resolve) => {
    const cancelarObservador = auth.onAuthStateChanged((usuario) => {
      cancelarObservador();
      resolve(usuario);
    });
  });
}

async function deletarDocumentosPorData({
  nomeColecao,
  data
}) {
  const dataTimestamp = Timestamp.fromDate(data);

  const consulta = query(
    collection(db, nomeColecao),
    where("criadoEm", ">=", dataTimestamp)
  );

  const snapshot = await getDocs(consulta);

  if (snapshot.empty) {
    return 0;
  }

  let batch = writeBatch(db);
  let operacoes = 0;
  let removidos = 0;

  for (const documento of snapshot.docs) {
    batch.delete(doc(db, nomeColecao, documento.id));

    operacoes++;
    removidos++;

    if (operacoes >= 450) {
      await batch.commit();

      batch = writeBatch(db);
      operacoes = 0;
    }
  }

  if (operacoes > 0) {
    await batch.commit();
  }

  return removidos;
}

async function limparMovimentacoes() {
  const usuario = await aguardarLogin();

  if (!usuario || !usuarioAtualEhSuperadmin()) {
    limparMovimentacoesBtn.disabled = true;

    mostrarMensagem(
      limpezaMessage,
      "Acesso negado. Esta limpeza só pode ser feita pelo superadmin.",
      "error"
    );

    return;
  }

  const confirmar = window.confirm(
    "Tem certeza que deseja apagar as movimentações criadas a partir de 18/05/2026?\n\nIsso NÃO remove os pontos da Pontuação Geral.\n\nColeções afetadas:\n- historicoPontuacoes\n- ajustesManuais"
  );

  if (!confirmar) {
    return;
  }

  try {
    limparMovimentacoesBtn.disabled = true;
    limparMovimentacoesBtn.textContent = "Limpando...";

    let totalRemovido = 0;
    const resultadoPorColecao = [];

    for (const nomeColecao of colecoesParaLimpar) {
      const removidos = await deletarDocumentosPorData({
        nomeColecao,
        data: dataInicial
      });

      totalRemovido += removidos;

      resultadoPorColecao.push(`${nomeColecao}: ${removidos}`);
    }

    mostrarMensagem(
      limpezaMessage,
      `Limpeza concluída. Registros removidos: ${totalRemovido}. ${resultadoPorColecao.join(" | ")}. A Pontuação Geral não foi alterada.`,
      "success"
    );
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      limpezaMessage,
      `Erro ao limpar movimentações: ${erro.message || "tente novamente."}`,
      "error"
    );
  } finally {
    limparMovimentacoesBtn.disabled = false;
    limparMovimentacoesBtn.textContent = "Limpar movimentações a partir de 18/05/2026";
  }
}

async function iniciarPagina() {
  await configurarMenuPorPermissao();

  const usuario = await aguardarLogin();

  if (!usuario || !usuarioAtualEhSuperadmin()) {
    limparMovimentacoesBtn.disabled = true;

    mostrarMensagem(
      limpezaMessage,
      "Acesso negado. Entre com o usuário superadmin para usar esta página.",
      "error"
    );

    return;
  }

  mostrarMensagem(
    limpezaMessage,
    "Pronto para limpar. A Pontuação Geral não será alterada.",
    "success"
  );
}

limparMovimentacoesBtn.addEventListener("click", () => {
  limparMovimentacoes();
});

iniciarPagina();
