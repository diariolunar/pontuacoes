import { auth } from "../config/firebase.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  buscarUsuarioSistema
} from "../services/usuarios.service.js";

import {
  componentesProntos
} from "./components.js";

export async function fazerLogin(email, senha) {
  return await signInWithEmailAndPassword(auth, email, senha);
}

export async function fazerLogout() {
  await signOut(auth);
  window.location.href = "./login.html";
}

export function redirecionarSeLogado() {
  onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) return;

    const usuarioSistema = await buscarUsuarioSistema(usuarioAuth.uid);

    if (usuarioSistema?.ativo === true) {
      window.location.href = "./admin.html";
    }
  });
}

export function protegerPagina() {
  onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
      window.location.href = "./login.html";
      return;
    }

    const usuarioSistema = await buscarUsuarioSistema(usuarioAuth.uid);

    if (!usuarioSistema) {
      await signOut(auth);
      window.location.href = "./login.html";
      return;
    }

    if (usuarioSistema.ativo !== true) {
      await signOut(auth);
      window.location.href = "./login.html";
    }
  });
}

export async function obterUsuarioAtualSistema() {
  return new Promise((resolve, reject) => {
    let cancelarObservador = () => {};

    cancelarObservador = onAuthStateChanged(
      auth,
      async (usuarioAuth) => {
        cancelarObservador();

        try {
          if (!usuarioAuth) {
            resolve(null);
            return;
          }

          const usuarioSistema = await buscarUsuarioSistema(usuarioAuth.uid);

          if (!usuarioSistema || usuarioSistema.ativo !== true) {
            resolve(null);
            return;
          }

          resolve({
            auth: usuarioAuth,
            sistema: usuarioSistema
          });
        } catch (erro) {
          reject(erro);
        }
      },
      reject
    );
  });
}

export async function exigirSuperadmin() {
  const usuarioAtual = await obterUsuarioAtualSistema();

  if (!usuarioAtual) {
    window.location.href = "./login.html";
    return null;
  }

  if (usuarioAtual.sistema.role !== "superadmin") {
    window.location.href = "./admin.html";
    return null;
  }

  return usuarioAtual;
}

export async function configurarMenuPorPermissao() {
  await componentesProntos;

  const usuarioAtual = await obterUsuarioAtualSistema();

  const superadminItems = document.querySelectorAll("[data-superadmin-only]");
  const usuarioInfo = document.getElementById("usuarioSistemaInfo");

  if (!usuarioAtual) {
    superadminItems.forEach((item) => {
      item.remove();
    });

    return;
  }

  if (usuarioInfo) {
    usuarioInfo.textContent = `${usuarioAtual.sistema.nome} • ${usuarioAtual.sistema.role}`;
  }

  if (usuarioAtual.sistema.role !== "superadmin") {
    superadminItems.forEach((item) => {
      item.remove();
    });
  }
}

export async function configurarBotaoLogout() {
  await componentesProntos;

  const logoutBtn = document.getElementById("logoutBtn");

  if (!logoutBtn || logoutBtn.dataset.logoutConfigurado === "true") {
    return;
  }

  logoutBtn.dataset.logoutConfigurado = "true";
  logoutBtn.addEventListener("click", async () => {
    await fazerLogout();
  });
}
