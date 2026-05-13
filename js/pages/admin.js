import {
  protegerPagina,
  configurarBotaoLogout
} from "../core/auth.js";

import {
  listarPontuacaoGeral,
  listarUltimosEnviosSubs
} from "../services/pontuacoes.service.js";

protegerPagina();
configurarBotaoLogout();

const totalSubs = document.getElementById("totalSubs");
const totalMembros = document.getElementById("totalMembros");
const ultimosEnvios = document.getElementById("ultimosEnvios");

async function carregarDashboard() {
  try {
    const enviosSubs = await listarUltimosEnviosSubs();
    const ranking = await listarPontuacaoGeral();

    totalSubs.textContent = `${enviosSubs.length} envios`;
    totalMembros.textContent = `${ranking.length} membros`;

    if (enviosSubs.length === 0) {
      ultimosEnvios.innerHTML = `
        <div class="list-item">
          Nenhum envio de sub registrado ainda.
        </div>
      `;

      return;
    }

    ultimosEnvios.innerHTML = enviosSubs
      .slice(0, 8)
      .map((envio) => {
        return `
          <div class="list-item">
            <strong>${envio.sub}</strong><br>
            Semana: ${envio.semana}<br>
            Membros enviados: ${envio.totalMembros}
          </div>
        `;
      })
      .join("");
  } catch (erro) {
    console.error(erro);

    ultimosEnvios.innerHTML = `
      <div class="list-item">
        Erro ao carregar os dados do painel.
      </div>
    `;
  }
}

carregarDashboard();
