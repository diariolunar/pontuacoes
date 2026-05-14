import { db } from "../config/firebase.js";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import {
  criarIdSeguro,
  normalizarUser
} from "../core/utils.js";

import {
  buscarOuCriarMembro
} from "./membros.service.js";

export async function registrarPontuacaoSub({
  sub,
  semana,
  membros
}) {
  const envioRef = await addDoc(collection(db, "enviosSubs"), {
    sub,
    semana,
    totalMembros: membros.length,
    criadoEm: serverTimestamp()
  });

  for (const membro of membros) {
    const userNormalizado = normalizarUser(membro.user);

    await buscarOuCriarMembro({
      nome: membro.nome,
      user: userNormalizado,
      sub
    });

    await addDoc(collection(db, "pontuacoesSubs"), {
      envioId: envioRef.id,
      semana,
      sub,
      nome: membro.nome,
      user: userNormalizado,
      pontos: Number(membro.pontos),
      criadoEm: serverTimestamp()
    });

    await somarPontuacaoGeral({
      semana,
      nome: membro.nome,
      user: userNormalizado,
      categoria: "subs",
      pontos: Number(membro.pontos),
      origem: sub
    });
  }

  return envioRef.id;
}

export async function somarPontuacaoGeral({
  semana,
  nome,
  user,
  categoria,
  pontos,
  origem = ""
}) {
  const userNormalizado = normalizarUser(user);
  const rankingId = `${criarIdSeguro(semana)}_${criarIdSeguro(userNormalizado)}`;

  const rankingRef = doc(db, "pontuacaoGeral", rankingId);
  const rankingSnap = await getDoc(rankingRef);

  const campoCategoria = `total_${categoria}`;

  if (!rankingSnap.exists()) {
    await setDoc(rankingRef, {
      semana,
      nome,
      user: userNormalizado,
      [campoCategoria]: pontos,
      totalGeral: pontos,
      atualizadoEm: serverTimestamp()
    });
  } else {
    await updateDoc(rankingRef, {
      nome,
      user: userNormalizado,
      [campoCategoria]: increment(pontos),
      totalGeral: increment(pontos),
      atualizadoEm: serverTimestamp()
    });
  }

  await addDoc(collection(db, "historicoPontuacoes"), {
    semana,
    nome,
    user: userNormalizado,
    categoria,
    pontos,
    origem,
    criadoEm: serverTimestamp()
  });
}

export async function listarUltimosEnviosSubs() {
  const consulta = query(
    collection(db, "enviosSubs"),
    orderBy("criadoEm", "desc")
  );

  const snapshot = await getDocs(consulta);

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));
}

export async function listarEnviosSubs(semana = "") {
  const consulta = query(
    collection(db, "enviosSubs"),
    orderBy("criadoEm", "desc")
  );

  const snapshot = await getDocs(consulta);

  let envios = snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));

  if (semana) {
    envios = envios.filter((envio) => envio.semana === semana);
  }

  return envios;
}

export async function listarPontuacoesSubs(semana = "", sub = "") {
  const consulta = query(
    collection(db, "pontuacoesSubs"),
    orderBy("criadoEm", "desc")
  );

  const snapshot = await getDocs(consulta);

  let pontuacoes = snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));

  if (semana) {
    pontuacoes = pontuacoes.filter((pontuacao) => pontuacao.semana === semana);
  }

  if (sub) {
    pontuacoes = pontuacoes.filter((pontuacao) => pontuacao.sub === sub);
  }

  return pontuacoes;
}

export async function listarPontuacaoGeral(semana = "") {
  const consulta = query(
    collection(db, "pontuacaoGeral"),
    orderBy("totalGeral", "desc")
  );

  const snapshot = await getDocs(consulta);

  let pontuacoes = snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));

  if (semana) {
    pontuacoes = pontuacoes.filter((pontuacao) => pontuacao.semana === semana);
  }

  return pontuacoes;
}
