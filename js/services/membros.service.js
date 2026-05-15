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
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  criarIdSeguro,
  normalizarUser
} from "../core/utils.js";

export async function buscarOuCriarMembro({ nome, user }) {
  const userNormalizado = normalizarUser(user);
  const membroId = criarIdSeguro(userNormalizado);

  const membroRef = doc(db, "membros", membroId);
  const membroSnap = await getDoc(membroRef);

  if (membroSnap.exists()) {
    return {
      id: membroId,
      ...membroSnap.data()
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
    throw new Error("Já existe um membro cadastrado com esse user.");
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
    throw new Error("Já existe outro membro cadastrado com esse user.");
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

  const membroRef = doc(db, "membros", id);
  await deleteDoc(membroRef);
}