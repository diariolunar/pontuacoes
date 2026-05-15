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
  categoria: "adms",
  colecao: "pontuacaoAdms",
  origem: "Pontuação dos ADMs",
  pontosLabel: "Pontos",
  descricaoLabel: "Motivo/atividade",
  submitText: "Enviar Pontuação dos ADMs",
  exigirLogin: true
});