import { db } from "../config/firebase.js";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  criarIdSeguro,
  normalizarUser
} from "../core/utils.js";

const colecoesComUser = [
  "pontuacaoGeral",
  "historicoPontuacoes",
  "ajustesManuais",
  "pontuacoesSubs",
  "leituraLunar",
  "chuvaEstrelas",
  "pontuacaoAdms",
  "diarioLunar",
  "ascensao",
  "redesSociais",
  "divulgacoes"
];

function documentoPertenceAoUser(documento, userIdSeguro) {
  const dados = documento.data();
  const userDoDocumento = criarIdSeguro(dados.user || "");
  const idDoDocumento = String(documento.id || "");

  if (userDoDocumento === userIdSeguro) {
    return true;
  }

  if (idDoDocumento === userIdSeguro) {
    return true;
  }

  if (idDoDocumento.endsWith(`_${userIdSeguro}`)) {
    return true;
  }

  return false;
}

async function apagarDocumentosDoUser(userIdSeguro) {
  let batch = writeBatch(db);
  let operacoes = 0;
  let removidos = 0;

  async function confirmarBatchSeNecessario(forcar = false) {
    if (operacoes === 0) {
      return;
    }

    if (forcar || operacoes >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      operacoes = 0;
    }
  }

  for (const nomeColecao of colecoesComUser) {
    const snapshot = await getDocs(collection(db, nomeColecao));

    for (const documento of snapshot.docs) {
      if (!documentoPertenceAoUser(documento, userIdSeguro)) {
        continue;
      }

      batch.delete(doc(db, nomeColecao, documento.id));
      operacoes++;
      removidos++;

      await confirmarBatchSeNecessario();
    }
  }

  await confirmarBatchSeNecessario(true);

  return removidos;
}

export async function buscarOuCriarMembro({ nome, user }) {
  const userNormalizado = normalizarUser(user);
  const membroId = criarIdSeguro(userNormalizado);

  const membroRef = doc(db, "membros", membroId);
  const membroSnap = await getDoc(membroRef);

  if (membroSnap.exists()) {
    const dadosAtuais = membroSnap.data();

    const dadosAtualizados = {
      nome: dadosAtuais.nome || nome.trim(),
      user: userNormalizado,
      atualizadoEm: serverTimestamp()
    };

    await updateDoc(membroRef, dadosAtualizados);

    return {
      id: membroId,
      ...dadosAtuais,
      ...dadosAtualizados
    };
  }

  const novoMembro = {
    nome: nome.trim(),
    user: userNormalizado,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  };

  await setDoc(membroRef, novoMembro);

  return {
    id: membroId,
    ...novoMembro
  };
}

export async function cadastrarMembro({
  nome,
  user
}) {
  const userNormalizado = normalizarUser(user);
  const membroId = criarIdSeguro(userNormalizado);

  const membroRef = doc(db, "membros", membroId);
  const membroSnap = await getDoc(membroRef);

  if (membroSnap.exists()) {
    const dadosAtuais = membroSnap.data();

    await updateDoc(membroRef, {
      nome: nome.trim(),
      user: userNormalizado,
      atualizadoEm: serverTimestamp()
    });

    return {
      id: membroId,
      ...dadosAtuais,
      nome: nome.trim(),
      user: userNormalizado
    };
  }

  const novoMembro = {
    nome: nome.trim(),
    user: userNormalizado,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  };

  await setDoc(membroRef, novoMembro);

  return {
    id: membroId,
    ...novoMembro
  };
}

export async function listarMembros() {
  const consulta = query(
    collection(db, "membros"),
    orderBy("nome", "asc")
  );

  const snapshot = await getDocs(consulta);

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));
}

export async function buscarMembroPorId(id) {
  if (!id) return null;

  const membroRef = doc(db, "membros", id);
  const membroSnap = await getDoc(membroRef);

  if (!membroSnap.exists()) {
    return null;
  }

  return {
    id,
    ...membroSnap.data()
  };
}

export async function atualizarMembro({
  idAtual,
  nome,
  user
}) {
  const userNormalizado = normalizarUser(user);
  const novoId = criarIdSeguro(userNormalizado);

  const dadosAtualizados = {
    nome: nome.trim(),
    user: userNormalizado,
    atualizadoEm: serverTimestamp()
  };

  if (novoId === idAtual) {
    const membroRef = doc(db, "membros", idAtual);

    await updateDoc(membroRef, dadosAtualizados);

    return {
      id: idAtual,
      ...dadosAtualizados
    };
  }

  const novoMembroRef = doc(db, "membros", novoId);
  const novoMembroSnap = await getDoc(novoMembroRef);

  if (novoMembroSnap.exists()) {
    const dadosExistentes = novoMembroSnap.data();

    await updateDoc(novoMembroRef, dadosAtualizados);
    await deleteDoc(doc(db, "membros", idAtual));

    return {
      id: novoId,
      ...dadosExistentes,
      ...dadosAtualizados
    };
  }

  const membroAtual = await buscarMembroPorId(idAtual);

  if (!membroAtual) {
    throw new Error("Membro original não encontrado.");
  }

  const membroAntigoRef = doc(db, "membros", idAtual);

  await setDoc(novoMembroRef, {
    nome: dadosAtualizados.nome,
    user: dadosAtualizados.user,
    criadoEm: membroAtual.criadoEm || serverTimestamp(),
    atualizadoEm: serverTimestamp()
  });

  await deleteDoc(membroAntigoRef);

  return {
    id: novoId,
    ...dadosAtualizados
  };
}

export async function excluirMembro(id) {
  if (!id) {
    throw new Error("ID do membro não informado.");
  }

  const membroAtual = await buscarMembroPorId(id);
  const userIdSeguro = membroAtual?.user
    ? criarIdSeguro(membroAtual.user)
    : criarIdSeguro(id);

  const totalDocumentosRemovidos = await apagarDocumentosDoUser(userIdSeguro);

  const membroRef = doc(db, "membros", id);
  await deleteDoc(membroRef);

  return {
    id,
    totalDocumentosRemovidos
  };
}
