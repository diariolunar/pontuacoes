import {
  iniciarEnvioCategoriaVariavel
} from "./categoria-variavel-envio.js";

iniciarEnvioCategoriaVariavel({
  formId: "categoriaForm",
  listaTextoId: "listaTexto",
  membersListId: "membersList",
  addMemberBtnId: "addMemberBtn",
  lerListaBtnId: "lerListaBtn",
  messageId: "categoriaMessage",
  categoria: "diarioLunar",
  colecao: "diarioLunar",
  origem: "Diário Lunar",
  pontosLabel: "Pontos",
  descricaoLabel: "Atividade",
  submitText: "Enviar Diário Lunar"
});