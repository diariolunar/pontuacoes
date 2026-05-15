import { db } from "../config/firebase.js";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
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
    const pontos = Number(membro.pontos || 0);

    await buscarOuCriarMembro({
      nome: membro.nome,
      user: userNormalizado
    });

    await addDoc(collection(db, "pontuacoesSubs"), {
      envioId: envioRef.id,
      semana,
      sub,
      nome: membro.nome,
      user: userNormalizado,
      pontos,
      criadoEm: serverTimestamp()
    });

    await somarPontuacaoGeral({
      semana,
      nome: membro.nome,
      user: userNormalizado,
      categoria: "subs",
      pontos,
      origem: sub
    });
  }

  return envioRef.id;
}

export async function registrarPontuacaoFixa({
  semana,
  membros,
  categoria,
  pontos,
  colecao,
  origem
}) {
  const envioRef = await addDoc(collection(db, `envios_${colecao}`), {
    semana,
    categoria,
    origem,
    pontosPorMembro: Number(pontos || 0),
    totalMembros: membros.length,
    criadoEm: serverTimestamp()
  });

  for (const membro of membros) {
    const userNormalizado = normalizarUser(membro.user);
    const pontosNumericos = Number(pontos || 0);

    await buscarOuCriarMembro({
      nome: membro.nome,
      user: userNormalizado
    });

    await addDoc(collection(db, colecao), {
      envioId: envioRef.id,
      semana,
      categoria,
      origem,
      nome: membro.nome,
      user: userNormalizado,
      pontos: pontosNumericos,
      criadoEm: serverTimestamp()
    });

    await somarPontuacaoGeral({
      semana,
      nome: membro.nome,
      user: userNormalizado,
      categoria,
      pontos: pontosNumericos,
      origem
    });
  }

  return envioRef.id;
}

export async function registrarLeituraLunar({
  semana,
  membros
}) {
  return await registrarPontuacaoFixa({
    semana,
    membros,
    categoria: "leituraLunar",
    pontos: 50,
    colecao: "leituraLunar",
    origem: "Leitura Lunar"
  });
}

export async function registrarChuvaEstrelas({
  semana,
  membros
}) {
  return await registrarPontuacaoFixa({
    semana,
    membros,
    categoria: "chuvaEstrelas",
    pontos: 100,
    colecao: "chuvaEstrelas",
    origem: "Chuva de Estrelas"
  });
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
  const pontuacaoId = `${criarIdSeguro(semana)}_${criarIdSeguro(userNormalizado)}`;

  const pontuacaoRef = doc(db, "pontuacaoGeral", pontuacaoId);
  const pontuacaoSnap = await getDoc(pontuacaoRef);

  const campoCategoria = `total_${categoria}`;

  if (!pontuacaoSnap.exists()) {
    await setDoc(pontuacaoRef, {
      semana,
      nome,
      user: userNormalizado,
      [campoCategoria]: Number(pontos || 0),
      totalGeral: Number(pontos || 0),
      atualizadoEm: serverTimestamp()
    });
  } else {
    await updateDoc(pontuacaoRef, {
      nome,
      user: userNormalizado,
      [campoCategoria]: increment(Number(pontos || 0)),
      totalGeral: increment(Number(pontos || 0)),
      atualizadoEm: serverTimestamp()
    });
  }

  await addDoc(collection(db, "historicoPontuacoes"), {
    semana,
    nome,
    user: userNormalizado,
    categoria,
    pontos: Number(pontos || 0),
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

export async function listarPontuacoesCategoria({
  colecao,
  semana = ""
}) {
  const consulta = query(
    collection(db, colecao),
    orderBy("criadoEm", "desc")
  );

  const snapshot = await getDocs(consulta);

  let registros = snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));

  if (semana) {
    registros = registros.filter((registro) => registro.semana === semana);
  }

  return registros;
}

export async function limparPontuacoesCategoriaSemana({
  colecao,
  semana
}) {
  if (!colecao || !semana) {
    throw new Error("Coleção ou semana não informada.");
  }

  const registrosSnapshot = await getDocs(collection(db, colecao));

  const registrosDaSemana = registrosSnapshot.docs.filter((documento) => {
    const dados = documento.data();
    return dados.semana === semana;
  });

  for (const documento of registrosDaSemana) {
    await deleteDoc(doc(db, colecao, documento.id));
  }

  const enviosColecao = `envios_${colecao}`;
  const enviosSnapshot = await getDocs(collection(db, enviosColecao));

  const enviosDaSemana = enviosSnapshot.docs.filter((documento) => {
    const dados = documento.data();
    return dados.semana === semana;
  });

  for (const documento of enviosDaSemana) {
    await deleteDoc(doc(db, enviosColecao, documento.id));
  }

  return {
    registrosRemovidos: registrosDaSemana.length,
    enviosRemovidos: enviosDaSemana.length
  };
}