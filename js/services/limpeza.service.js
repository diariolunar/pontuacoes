import { db } from "../config/firebase.js";

import {
  collection,
  deleteDoc,
  doc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const colecoesPermitidas = [
  "historicoPontuacoes",
  "ajustesManuais"
];

function converterDataFirestore(valor) {
  if (!valor) {
    return null;
  }

  if (typeof valor.toDate === "function") {
    return valor.toDate();
  }

  if (valor.seconds) {
    return new Date(valor.seconds * 1000);
  }

  return null;
}

function ordenarPorDataDesc(lista) {
  return [...lista].sort((a, b) => {
    const dataA = converterDataFirestore(a.criadoEm)?.getTime() || 0;
    const dataB = converterDataFirestore(b.criadoEm)?.getTime() || 0;

    return dataB - dataA;
  });
}

function formatarRegistroHistorico(documento) {
  const dados = documento.data();

  return {
    id: documento.id,
    colecao: "historicoPontuacoes",
    tipo: "Histórico",
    nome: dados.nome || "",
    user: dados.user || "",
    categoria: dados.categoria || "",
    pontos: Number(dados.pontos || 0),
    origem: dados.origem || "",
    motivo: "",
    semana: dados.semana || "",
    criadoEm: dados.criadoEm || null
  };
}

function formatarRegistroAjuste(documento) {
  const dados = documento.data();

  return {
    id: documento.id,
    colecao: "ajustesManuais",
    tipo: "Ajuste Manual",
    nome: dados.nome || "",
    user: dados.user || "",
    categoria: "ajustes",
    pontos: Number(dados.pontos || 0),
    origem: "",
    motivo: dados.motivo || "",
    semana: dados.semana || "",
    criadoEm: dados.criadoEm || null
  };
}

export async function listarRegistrosDeMovimentacao() {
  const registros = [];

  const historicoSnapshot = await getDocs(collection(db, "historicoPontuacoes"));

  historicoSnapshot.docs.forEach((documento) => {
    registros.push(formatarRegistroHistorico(documento));
  });

  const ajustesSnapshot = await getDocs(collection(db, "ajustesManuais"));

  ajustesSnapshot.docs.forEach((documento) => {
    registros.push(formatarRegistroAjuste(documento));
  });

  return ordenarPorDataDesc(registros);
}

export async function excluirRegistroDeMovimentacao({
  colecao,
  id
}) {
  if (!colecoesPermitidas.includes(colecao)) {
    throw new Error("Coleção não permitida para exclusão.");
  }

  if (!id) {
    throw new Error("ID do registro não informado.");
  }

  await deleteDoc(doc(db, colecao, id));

  return {
    colecao,
    id
  };
}
