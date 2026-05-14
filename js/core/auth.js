import { auth } from "../config/firebase.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  buscarUsuarioSistema
} from "../services/usuarios.service.js";

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
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (usuarioAuth) => {
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
    });
  });
}

export async function exigirSuperadmin() {
  const usuarioAtual = await obterUsuarioAtualSistema();

  if (!usuarioAtual || usuarioAtual.sistema.role !== "superadmin") {
    window.location.href = "./admin.html";
    return null;
  }

  return usuarioAtual;
}

export async function configurarMenuPorPermissao() {
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

export function configurarBotaoLogout() {
  setTimeout(() => {
    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async () => {
      await fazerLogout();
    });
  }, 300);
}
