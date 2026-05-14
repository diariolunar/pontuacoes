import { db } from "../config/firebase.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

export async function buscarUsuarioSistema(uid) {
  if (!uid) return null;

  const usuarioRef = doc(db, "usuariosSistema", uid);
  const usuarioSnap = await getDoc(usuarioRef);

  if (!usuarioSnap.exists()) {
    return null;
  }

  return {
    uid,
    ...usuarioSnap.data()
  };
}

export async function listarUsuariosSistema({ incluirOcultos = false } = {}) {
  const consulta = query(
    collection(db, "usuariosSistema"),
    orderBy("nome", "asc")
  );

  const snapshot = await getDocs(consulta);

  let usuarios = snapshot.docs.map((documento) => ({
    uid: documento.id,
    ...documento.data()
  }));

  if (!incluirOcultos) {
    usuarios = usuarios.filter((usuario) => usuario.oculto !== true);
  }

  return usuarios;
}
