import {
  exigirSuperadmin,
  configurarBotaoLogout,
  configurarMenuPorPermissao
} from "../core/auth.js";

import {
  listarUsuariosSistema
} from "../services/usuarios.service.js";

import {
  escaparHtml,
  mostrarMensagem
} from "../core/utils.js";

const cadastrosTabela = document.getElementById("cadastrosTabela");
const cadastrosMessage = document.getElementById("cadastrosMessage");
const totalCadastrosTexto = document.getElementById("totalCadastrosTexto");

configurarBotaoLogout();

function formatarRole(role) {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Admin";

  return role || "Sem acesso";
}

function formatarStatus(ativo) {
  return ativo === true ? "Ativo" : "Inativo";
}

function criarLinhaUsuario(usuario) {
  return `
    <tr>
      <td>${escaparHtml(usuario.nome || "Sem nome")}</td>
      <td>${escaparHtml(usuario.email || "Sem email")}</td>
      <td>${escaparHtml(formatarRole(usuario.role))}</td>
      <td>${escaparHtml(formatarStatus(usuario.ativo))}</td>
    </tr>
  `;
}

async function carregarCadastros() {
  try {
    const usuarioAtual = await exigirSuperadmin();

    if (!usuarioAtual) {
      return;
    }

    await configurarMenuPorPermissao();

    const usuarios = await listarUsuariosSistema({
      incluirOcultos: false
    });

    totalCadastrosTexto.textContent = `Cadastros encontrados: ${usuarios.length}`;

    if (usuarios.length === 0) {
      cadastrosTabela.innerHTML = `
        <tr>
          <td colspan="4">Nenhum cadastro visível encontrado.</td>
        </tr>
      `;

      return;
    }

    cadastrosTabela.innerHTML = usuarios
      .map((usuario) => criarLinhaUsuario(usuario))
      .join("");

    cadastrosMessage.textContent = "";
    cadastrosMessage.className = "message";
  } catch (erro) {
    console.error(erro);

    mostrarMensagem(
      cadastrosMessage,
      "Erro ao carregar os cadastros. Verifique o Firebase e tente novamente.",
      "error"
    );
  }
}

carregarCadastros();
