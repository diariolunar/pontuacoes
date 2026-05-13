import {
  fazerLogin,
  redirecionarSeLogado
} from "../core/auth.js";

import {
  mostrarMensagem
} from "../core/utils.js";

redirecionarSeLogado();

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    await fazerLogin(email, senha);

    mostrarMensagem(loginMessage, "Login realizado com sucesso!", "success");

    window.location.href = "./admin.html";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      loginMessage,
      "Não foi possível entrar. Verifique o email e a senha.",
      "error"
    );
  }
});
