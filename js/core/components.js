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

document.addEventListener("DOMContentLoaded", async () => {
  configurarTituloEFavicon();

  await Promise.all([
    carregarComponente("header", "./components/header.html"),
    carregarComponente("sidebar", "./components/sidebar.html"),
    carregarComponente("footer", "./components/footer.html")
  ]);
});
