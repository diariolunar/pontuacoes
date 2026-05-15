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
  categoria: "divulgacoes",
  colecao: "divulgacoes",
  origem: "Divulgações",
  pontosLabel: "Pontos",
  descricaoLabel: "Descrição da divulgação",
  submitText: "Enviar Divulgações"
});