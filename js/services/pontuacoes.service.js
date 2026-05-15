import { db } from "../config/firebase.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  criarIdSeguro,
  normalizarUser
} from "../core/utils.js";

function ordenarPorCriadoEmDesc(lista) {
  return [...lista].sort((a, b) => {
    const dataA = a.criadoEm?.seconds || 0;
    const dataB = b.criadoEm?.seconds || 0;

    return dataB - dataA;
  });
}

function ordenarPorTotalDesc(lista) {
  return [...lista].sort((a, b) => {
    return Number(b.totalGeral || 0) - Number(a.totalGeral || 0);
  });
}

async function prepararMembroNoBatch(batch, { nome, user }) {
  const userNormalizado = normalizarUser(user);
  const membroId = criarIdSeguro(userNormalizado);
  const membroRef = doc(db, "membros", membroId);
  const membroSnap = await getDoc(membroRef);

  if (!membroSnap.exists()) {
    batch.set(membroRef, {
      nome: nome.trim(),
      user: userNormalizado,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
  }

  return userNormalizado;
}

async function somarPontuacaoGeralNoBatch(batch, {
  semana,
  nome,
  user,
  categoria,
  pontos
}) {
  const userNormalizado = normalizarUser(user);
  const pontuacaoId = `${criarIdSeguro(semana)}_${criarIdSeguro(userNormalizado)}`;
  const pontuacaoRef = doc(db, "pontuacaoGeral", pontuacaoId);
  const pontuacaoSnap = await getDoc(pontuacaoRef);

  const campoCategoria = `total_${categoria}`;
  const pontosNumericos = Number(pontos || 0);

  if (!pontuacaoSnap.exists()) {
    batch.set(pontuacaoRef, {
      semana,
      nome,
      user: userNormalizado,
      [campoCategoria]: pontosNumericos,
      totalGeral: pontosNumericos,
      atualizadoEm: serverTimestamp()
    });
  } else {
    batch.update(pontuacaoRef, {
      [campoCategoria]: increment(pontosNumericos),
      totalGeral: increment(pontosNumericos),
      atualizadoEm: serverTimestamp()
    });
  }
}

function adicionarHistoricoNoBatch(batch, {
  semana,
  nome,
  user,
  categoria,
  pontos,
  origem = ""
}) {
  const historicoRef = doc(collection(db, "historicoPontuacoes"));

  batch.set(historicoRef, {
    semana,
    nome,
    user: normalizarUser(user),
    categoria,
    pontos: Number(pontos || 0),
    origem,
    criadoEm: serverTimestamp()
  });
}

export async function registrarPontuacaoSub({
  sub,
  semana,
  membros
}) {
  const batch = writeBatch(db);
  const envioRef = doc(collection(db, "enviosSubs"));

  batch.set(envioRef, {
    sub,
    semana,
    totalMembros: membros.length,
    criadoEm: serverTimestamp()
  });

  for (const membro of membros) {
    const userNormalizado = await prepararMembroNoBatch(batch, {
      nome: membro.nome,
      user: membro.user
    });

    const pontos = Number(membro.pontos || 0);
    const pontuacaoRef = doc(collection(db, "pontuacoesSubs"));

    batch.set(pontuacaoRef, {
      envioId: envioRef.id,
      semana,
      sub,
      nome: membro.nome,
      user: userNormalizado,
      pontos,
      criadoEm: serverTimestamp()
    });

    await somarPontuacaoGeralNoBatch(batch, {
      semana,
      nome: membro.nome,
      user: userNormalizado,
      categoria: "subs",
      pontos
    });

    adicionarHistoricoNoBatch(batch, {
      semana,
      nome: membro.nome,
      user: userNormalizado,
      categoria: "subs",
      pontos,
      origem: sub
    });
  }

  await batch.commit();

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
  const batch = writeBatch(db);
  const envioRef = doc(collection(db, `envios_${colecao}`));

  batch.set(envioRef, {
    semana,
    categoria,
    origem,
    pontosPorMembro: Number(pontos || 0),
    totalMembros: membros.length,
    criadoEm: serverTimestamp()
  });

  for (const membro of membros) {
    const userNormalizado = await prepararMembroNoBatch(batch, {
      nome: membro.nome,
      user: membro.user
    });

    const pontosNumericos = Number(pontos || 0);
    const registroRef = doc(collection(db, colecao));

    batch.set(registroRef, {
      envioId: envioRef.id,
      semana,
      categoria,
      origem,
      nome: membro.nome,
      user: userNormalizado,
      pontos: pontosNumericos,
      criadoEm: serverTimestamp()
    });

    await somarPontuacaoGeralNoBatch(batch, {
      semana,
      nome: membro.nome,
      user: userNormalizado,
      categoria,
      pontos: pontosNumericos
    });

    adicionarHistoricoNoBatch(batch, {
      semana,
      nome: membro.nome,
      user: userNormalizado,
      categoria,
      pontos: pontosNumericos,
      origem
    });
  }

  await batch.commit();

  return envioRef.id;
}

export async function registrarPontuacaoVariavel({
  semana,
  membros,
  categoria,
  colecao,
  origem
}) {
  const batch = writeBatch(db);
  const envioRef = doc(collection(db, `envios_${colecao}`));

  batch.set(envioRef, {
    semana,
    categoria,
    origem,
    totalMembros: membros.length,
    criadoEm: serverTimestamp()
  });

  for (const membro of membros) {
    const userNormalizado = await prepararMembroNoBatch(batch, {
      nome: membro.nome,
      user: membro.user
    });

    const pontos = Number(membro.pontos || 0);
    const descricao = membro.descricao || "";
    const registroRef = doc(collection(db, colecao));

    batch.set(registroRef, {
      envioId: envioRef.id,
      semana,
      categoria,
      origem,
      nome: membro.nome,
      user: userNormalizado,
      pontos,
      descricao,
      criadoEm: serverTimestamp()
    });

    await somarPontuacaoGeralNoBatch(batch, {
      semana,
      nome: membro.nome,
      user: userNormalizado,
      categoria,
      pontos
    });

    adicionarHistoricoNoBatch(batch, {
      semana,
      nome: membro.nome,
      user: userNormalizado,
      categoria,
      pontos,
      origem: descricao ? `${origem}: ${descricao}` : origem
    });
  }

  await batch.commit();

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

export async function registrarAjusteManual({
  semana,
  nome,
  user,
  tipo,
  pontos,
  motivo
}) {
  const resultados = await registrarAjustesManuais({
    semana,
    ajustes: [
      {
        nome,
        user,
        tipo,
        pontos,
        motivo
      }
    ]
  });

  return resultados[0];
}

export async function registrarAjustesManuais({
  semana,
  ajustes
}) {
  const batch = writeBatch(db);
  const resultados = [];

  for (const ajuste of ajustes) {
    const userNormalizado = await prepararMembroNoBatch(batch, {
      nome: ajuste.nome,
      user: ajuste.user
    });

    const pontosBase = Math.abs(Number(ajuste.pontos || 0));
    const pontosFinais = ajuste.tipo === "remover" ? pontosBase * -1 : pontosBase;
    const ajusteRef = doc(collection(db, "ajustesManuais"));

    batch.set(ajusteRef, {
      semana,
      nome: ajuste.nome,
      user: userNormalizado,
      tipo: ajuste.tipo,
      pontos: pontosFinais,
      motivo: ajuste.motivo,
      criadoEm: serverTimestamp()
    });

    await somarPontuacaoGeralNoBatch(batch, {
      semana,
      nome: ajuste.nome,
      user: userNormalizado,
      categoria: "ajustes",
      pontos: pontosFinais
    });

    adicionarHistoricoNoBatch(batch, {
      semana,
      nome: ajuste.nome,
      user: userNormalizado,
      categoria: "ajustes",
      pontos: pontosFinais,
      origem: `Ajuste manual: ${ajuste.motivo}`
    });

    resultados.push({
      semana,
      nome: ajuste.nome,
      user: userNormalizado,
      tipo: ajuste.tipo,
      pontos: pontosFinais,
      motivo: ajuste.motivo
    });
  }

  await batch.commit();

  return resultados;
}

export async function somarPontuacaoGeral({
  semana,
  nome,
  user,
  categoria,
  pontos,
  origem = ""
}) {
  const batch = writeBatch(db);

  await somarPontuacaoGeralNoBatch(batch, {
    semana,
    nome,
    user,
    categoria,
    pontos
  });

  adicionarHistoricoNoBatch(batch, {
    semana,
    nome,
    user,
    categoria,
    pontos,
    origem
  });

  await batch.commit();
}

export async function listarUltimosEnviosSubs() {
  const snapshot = await getDocs(collection(db, "enviosSubs"));

  return ordenarPorCriadoEmDesc(
    snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }))
  );
}

export async function listarEnviosSubs(semana = "") {
  let consulta = collection(db, "enviosSubs");

  if (semana) {
    consulta = query(consulta, where("semana", "==", semana));
  }

  const snapshot = await getDocs(consulta);

  return ordenarPorCriadoEmDesc(
    snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }))
  );
}

export async function listarEnviosCategoria({
  colecao,
  semana = ""
}) {
  const nomeColecao = `envios_${colecao}`;
  let consulta = collection(db, nomeColecao);

  if (semana) {
    consulta = query(consulta, where("semana", "==", semana));
  }

  const snapshot = await getDocs(consulta);

  return ordenarPorCriadoEmDesc(
    snapshot.docs.map((documento) => ({
      id: documento.id,
      colecao,
      ...documento.data()
    }))
  );
}

export async function listarPontuacoesSubs(semana = "", sub = "") {
  let consulta = collection(db, "pontuacoesSubs");

  if (semana) {
    consulta = query(consulta, where("semana", "==", semana));
  }

  const snapshot = await getDocs(consulta);

  let pontuacoes = snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));

  if (sub) {
    pontuacoes = pontuacoes.filter((pontuacao) => pontuacao.sub === sub);
  }

  return ordenarPorCriadoEmDesc(pontuacoes);
}

export async function listarPontuacaoGeral(semana = "") {
  let consulta = collection(db, "pontuacaoGeral");

  if (semana) {
    consulta = query(consulta, where("semana", "==", semana));
  }

  const snapshot = await getDocs(consulta);

  return ordenarPorTotalDesc(
    snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }))
  );
}

export async function listarPontuacoesCategoria({
  colecao,
  semana = ""
}) {
  let consulta = collection(db, colecao);

  if (semana) {
    consulta = query(consulta, where("semana", "==", semana));
  }

  const snapshot = await getDocs(consulta);

  return ordenarPorCriadoEmDesc(
    snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }))
  );
}

export async function listarAjustesManuais(semana = "") {
  let consulta = collection(db, "ajustesManuais");

  if (semana) {
    consulta = query(consulta, where("semana", "==", semana));
  }

  const snapshot = await getDocs(consulta);

  return ordenarPorCriadoEmDesc(
    snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }))
  );
}

export async function listarHistoricoPorUser({
  user,
  semana = ""
}) {
  const userNormalizado = normalizarUser(user);

  let consulta = query(
    collection(db, "historicoPontuacoes"),
    where("user", "==", userNormalizado)
  );

  const snapshot = await getDocs(consulta);

  let historico = snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));

  if (semana) {
    historico = historico.filter((item) => item.semana === semana);
  }

  return ordenarPorCriadoEmDesc(historico);
}

export async function limparPontuacoesCategoriaSemana({
  colecao,
  semana
}) {
  if (!colecao || !semana) {
    throw new Error("Coleção ou semana não informada.");
  }

  const batch = writeBatch(db);

  const registrosSnapshot = await getDocs(
    query(collection(db, colecao), where("semana", "==", semana))
  );

  for (const documento of registrosSnapshot.docs) {
    batch.delete(doc(db, colecao, documento.id));
  }

  const enviosColecao = `envios_${colecao}`;

  const enviosSnapshot = await getDocs(
    query(collection(db, enviosColecao), where("semana", "==", semana))
  );

  for (const documento of enviosSnapshot.docs) {
    batch.delete(doc(db, enviosColecao, documento.id));
  }

  await batch.commit();

  return {
    registrosRemovidos: registrosSnapshot.docs.length,
    enviosRemovidos: enviosSnapshot.docs.length
  };
}

export async function limparPontuacoesSubsSemana({
  semana
}) {
  if (!semana) {
    throw new Error("Semana não informada.");
  }

  const batch = writeBatch(db);

  const pontuacoesSnapshot = await getDocs(
    query(collection(db, "pontuacoesSubs"), where("semana", "==", semana))
  );

  for (const documento of pontuacoesSnapshot.docs) {
    batch.delete(doc(db, "pontuacoesSubs", documento.id));
  }

  const enviosSnapshot = await getDocs(
    query(collection(db, "enviosSubs"), where("semana", "==", semana))
  );

  for (const documento of enviosSnapshot.docs) {
    batch.delete(doc(db, "enviosSubs", documento.id));
  }

  await batch.commit();

  return {
    registrosRemovidos: pontuacoesSnapshot.docs.length,
    enviosRemovidos: enviosSnapshot.docs.length
  };
}

export async function limparPontuacoesSubSemana({
  semana,
  sub
}) {
  if (!semana || !sub) {
    throw new Error("Semana ou sub não informado.");
  }

  const batch = writeBatch(db);

  const pontuacoesSnapshot = await getDocs(
    query(
      collection(db, "pontuacoesSubs"),
      where("semana", "==", semana),
      where("sub", "==", sub)
    )
  );

  for (const documento of pontuacoesSnapshot.docs) {
    batch.delete(doc(db, "pontuacoesSubs", documento.id));
  }

  const enviosSnapshot = await getDocs(
    query(
      collection(db, "enviosSubs"),
      where("semana", "==", semana),
      where("sub", "==", sub)
    )
  );

  for (const documento of enviosSnapshot.docs) {
    batch.delete(doc(db, "enviosSubs", documento.id));
  }

  await batch.commit();

  return {
    registrosRemovidos: pontuacoesSnapshot.docs.length,
    enviosRemovidos: enviosSnapshot.docs.length
  };
}
