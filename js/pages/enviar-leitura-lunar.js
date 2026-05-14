alert("O arquivo enviar-leitura-lunar.js carregou.");

document.addEventListener("DOMContentLoaded", () => {
  const leituraMessage = document.getElementById("leituraMessage");
  const lerListaBtn = document.getElementById("lerListaBtn");
  const addMemberBtn = document.getElementById("addMemberBtn");
  const membersList = document.getElementById("membersList");
  const listaTexto = document.getElementById("listaTexto");

  if (leituraMessage) {
    leituraMessage.textContent = "JS carregado corretamente nesta página.";
    leituraMessage.className = "message success";
  }

  if (!lerListaBtn) {
    alert("Não encontrei o botão lerListaBtn.");
    return;
  }

  if (!addMemberBtn) {
    alert("Não encontrei o botão addMemberBtn.");
    return;
  }

  if (!membersList) {
    alert("Não encontrei a div membersList.");
    return;
  }

  if (!listaTexto) {
    alert("Não encontrei o campo listaTexto.");
    return;
  }

  addMemberBtn.addEventListener("click", () => {
    alert("Botão Adicionar membro funcionou.");

    const linha = document.createElement("div");
    linha.className = "member-row";

    linha.innerHTML = `
      <input type="text" class="member-name" value="Teste Nome" />
      <input type="text" class="member-user" value="@testeuser" />
      <input type="number" class="member-points" value="50" readonly />
      <button type="button" class="remove-member">×</button>
    `;

    linha.querySelector(".remove-member").addEventListener("click", () => {
      linha.remove();
    });

    membersList.appendChild(linha);
  });

  lerListaBtn.addEventListener("click", () => {
    alert("Botão Ler lista automaticamente funcionou.");

    const texto = listaTexto.value.trim();

    if (!texto) {
      leituraMessage.textContent = "O botão funcionou, mas a lista está vazia.";
      leituraMessage.className = "message error";
      return;
    }

    leituraMessage.textContent = `O botão funcionou. Texto recebido: ${texto}`;
    leituraMessage.className = "message success";
  });
});
