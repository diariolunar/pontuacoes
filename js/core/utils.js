export function normalizarUser(user) {
  if (!user) return "";

  const userLimpo = String(user).trim().toLowerCase();

  if (userLimpo.startsWith("@")) {
    return userLimpo;
  }

  return `@${userLimpo}`;
}

export function normalizarBusca(valor) {
  return String(valor || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function criarIdSeguro(valor) {
  return String(valor || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/@/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function converterPontuacao(valor) {
  if (valor === null || valor === undefined) {
    return 0;
  }

  const texto = String(valor)
    .normalize("NFKC")
    .replace(/[^\d,.\-]/g, "")
    .replace(",", ".")
    .trim();

  if (!texto || texto === "-") {
    return 0;
  }

  const numero = Number(texto);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
}

export function gerarSemanaAtual() {
  const hoje = new Date();

  const inicio = new Date(hoje);
  const diaSemana = inicio.getDay();
  const diferencaParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;

  inicio.setDate(hoje.getDate() + diferencaParaSegunda);

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);

  const formatar = (data) => {
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return `${formatar(inicio)} a ${formatar(fim)}`;
}

export function escaparHtml(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function criarModalGlobalSeNaoExistir() {
  if (document.getElementById("sistemaModal")) {
    return;
  }

  const modal = document.createElement("dialog");

  modal.id = "sistemaModal";

  modal.style.cssText = `
    width: min(92vw, 460px);
    border: 1px solid rgba(155, 53, 217, 0.45);
    border-radius: 22px;
    padding: 0;
    background: #12001f;
    color: #f7efff;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
    overflow: hidden;
  `;

  modal.innerHTML = `
    <div style="padding: 22px;">
      <h2
        id="sistemaModalTitulo"
        style="
          margin: 0 0 10px;
          color: #ffd84d;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 24px;
          line-height: 1.15;
        "
      >
        Aviso
      </h2>

      <p
        id="sistemaModalTexto"
        style="
          line-height: 1.6;
          color: #cbb8d9;
          margin: 0 0 18px;
          white-space: pre-line;
          overflow-wrap: anywhere;
        "
      >
        Mensagem do sistema.
      </p>

      <div
        id="sistemaModalAcoes"
        style="
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        "
      >
        <button type="button" id="sistemaModalCancelarBtn" class="btn secondary full">
          Cancelar
        </button>

        <button type="button" id="sistemaModalConfirmarBtn" class="btn primary full">
          Entendi
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function obterTituloPorTipo(tipo) {
  if (tipo === "error") {
    return "Algo deu errado";
  }

  if (tipo === "success") {
    return "Tudo certo";
  }

  if (tipo === "warning") {
    return "Atenção";
  }

  return "Aviso";
}

function obterCorPorTipo(tipo) {
  if (tipo === "error") {
    return "#fecaca";
  }

  if (tipo === "success") {
    return "#86efac";
  }

  if (tipo === "warning") {
    return "#fcd34d";
  }

  return "#ffd84d";
}

function deveIgnorarModalOperacional(texto) {
  const textoNormalizado = normalizarBusca(texto);

  return (
    textoNormalizado.includes("enviando") ||
    textoNormalizado.includes("salvando") ||
    textoNormalizado.includes("carregando") ||
    textoNormalizado.includes("verificando") ||
    textoNormalizado.includes("limpando") ||
    textoNormalizado.includes("registrando") ||
    textoNormalizado.includes("cadastrando") ||
    textoNormalizado.includes("excluindo")
  );
}

export function abrirModalSistema({
  titulo = "Aviso",
  texto = "",
  tipo = "success",
  textoConfirmar = "Entendi",
  textoCancelar = "Cancelar",
  mostrarCancelar = false
} = {}) {
  criarModalGlobalSeNaoExistir();

  const modal = document.getElementById("sistemaModal");
  const tituloEl = document.getElementById("sistemaModalTitulo");
  const textoEl = document.getElementById("sistemaModalTexto");
  const confirmarBtn = document.getElementById("sistemaModalConfirmarBtn");
  const cancelarBtn = document.getElementById("sistemaModalCancelarBtn");

  if (!modal || !tituloEl || !textoEl || !confirmarBtn || !cancelarBtn) {
    window.alert(texto || titulo);
    return Promise.resolve(true);
  }

  tituloEl.textContent = titulo;
  tituloEl.style.color = obterCorPorTipo(tipo);

  textoEl.textContent = texto;

  confirmarBtn.textContent = textoConfirmar;
  cancelarBtn.textContent = textoCancelar;

  cancelarBtn.style.display = mostrarCancelar ? "inline-flex" : "none";

  confirmarBtn.className = tipo === "error" ? "btn danger full" : "btn primary full";
  cancelarBtn.className = "btn secondary full";

  return new Promise((resolve) => {
    const fecharConfirmando = () => {
      limparEventos();
      modal.close();
      resolve(true);
    };

    const fecharCancelando = () => {
      limparEventos();
      modal.close();
      resolve(false);
    };

    const fecharNoCancel = (evento) => {
      evento.preventDefault();

      if (mostrarCancelar) {
        fecharCancelando();
        return;
      }

      fecharConfirmando();
    };

    const limparEventos = () => {
      confirmarBtn.removeEventListener("click", fecharConfirmando);
      cancelarBtn.removeEventListener("click", fecharCancelando);
      modal.removeEventListener("cancel", fecharNoCancel);
    };

    confirmarBtn.addEventListener("click", fecharConfirmando);
    cancelarBtn.addEventListener("click", fecharCancelando);
    modal.addEventListener("cancel", fecharNoCancel);

    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      window.alert(texto || titulo);
      limparEventos();
      resolve(true);
    }
  });
}

export function confirmarModal({
  titulo = "Confirmar ação",
  texto = "Tem certeza que deseja continuar?",
  tipo = "warning",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar"
} = {}) {
  return abrirModalSistema({
    titulo,
    texto,
    tipo,
    textoConfirmar,
    textoCancelar,
    mostrarCancelar: true
  });
}

export function mostrarMensagem(elemento, texto, tipo = "success") {
  if (elemento) {
    elemento.textContent = texto;
    elemento.className = `message ${tipo}`;
  }

  if (!texto || deveIgnorarModalOperacional(texto)) {
    return;
  }

  abrirModalSistema({
    titulo: obterTituloPorTipo(tipo),
    texto,
    tipo,
    textoConfirmar: "Entendi",
    mostrarCancelar: false
  });
}