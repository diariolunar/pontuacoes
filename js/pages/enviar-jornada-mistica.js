import {
  iniciarEnvioCategoriaVariavel
} from "./categoria-variavel-envio.js";

import {
  lerListaJornadaMistica
} from "./jornada-mistica-parser.js";

iniciarEnvioCategoriaVariavel({
  formId: "categoriaForm",
  listaTextoId: "listaTexto",
  membersListId: "membersList",
  addMemberBtnId: "addMemberBtn",
  lerListaBtnId: "lerListaBtn",
  messageId: "categoriaMessage",
  categoria: "jornadaMistica",
  colecao: "jornadaMistica",
  origem: "Jornada Mística",
  pontosLabel: "Pontos",
  descricaoLabel: "Obras, feedback e resultado",
  submitText: "Enviar Jornada Mística",
  lerLista: lerListaJornadaMistica
});
