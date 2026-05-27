async function carregarComponente(id, caminho) {
  const elemento = document.getElementById(id);

  if (!elemento) {
    return;
  }

  try {
    const resposta = await fetch(caminho);

    if (!resposta.ok) {
      throw new Error(`Erro ao carregar ${caminho}`);
    }

    const html = await resposta.text();

    elemento.innerHTML = html;
  } catch (erro) {
    console.error(erro);
  }
}

function configurarTituloEFavicon() {
  const nomeSistema = "Central Lunar";

  if (!document.title || document.title.trim() === "") {
    document.title = nomeSistema;
  } else if (!document.title.includes(nomeSistema)) {
    document.title = `${document.title} | ${nomeSistema}`;
  }

  const faviconExistente = document.querySelector('link[rel="icon"]');

  if (!faviconExistente) {
    const favicon = document.createElement("link");

    favicon.rel = "icon";
    favicon.type = "image/png";
    favicon.href = "./assets/logo-lunar.png";

    document.head.appendChild(favicon);
  }

  const appleTouchIconExistente = document.querySelector('link[rel="apple-touch-icon"]');

  if (!appleTouchIconExistente) {
    const appleTouchIcon = document.createElement("link");

    appleTouchIcon.rel = "apple-touch-icon";
    appleTouchIcon.href = "./assets/logo-lunar.png";

    document.head.appendChild(appleTouchIcon);
  }
}

function criarModalGlobalSistema() {
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

document.addEventListener("DOMContentLoaded", async () => {
  configurarTituloEFavicon();
  criarModalGlobalSistema();

  await Promise.all([
    carregarComponente("header", "./components/header.html"),
    carregarComponente("sidebar", "./components/sidebar.html"),
    carregarComponente("footer", "./components/footer.html")
  ]);
});