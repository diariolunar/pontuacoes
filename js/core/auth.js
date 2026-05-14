import { auth } from "../config/firebase.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

export async function fazerLogin(email, senha) {
  return await signInWithEmailAndPassword(auth, email, senha);
}

export async function fazerLogout() {
  await signOut(auth);
  window.location.href = "./login.html";
}

export function protegerPagina() {
  onAuthStateChanged(auth, (usuario) => {
    if (!usuario) {
      window.location.href = "./login.html";
    }
  });
}

export function redirecionarSeLogado() {
  onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
      window.location.href = "./admin.html";
    }
  });
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
