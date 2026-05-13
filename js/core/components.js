async function carregarComponente(id, caminho) {
  const elemento = document.getElementById(id);

  if (!elemento) return;

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

await carregarComponente("header", "./components/header.html");
await carregarComponente("footer", "./components/footer.html");
await carregarComponente("sidebar", "./components/sidebar.html");
