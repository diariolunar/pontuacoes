import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  criarIdSeguro,
  normalizarUser
} from "../core/utils.js";

export async function buscarOuCriarMembro({ nome, user, sub = "" }) {
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
    nome,
    user: userNormalizado,
    sub,
    status: "ativo",
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  };

  await setDoc(membroRef, novoMembro);

  return {
    id: membroId,
    ...novoMembro
  };
}
