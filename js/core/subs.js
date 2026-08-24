export const SUBS_OFICIAIS = [
  {
    codigo: "A-1",
    nome: "A-1 Chama Eterna",
    titulo: "A-1 - Chama Eterna",
    desativado: false,
    chaves: ["chama eterna"],
    aliases: []
  },
  {
    codigo: "A-2",
    nome: "A-2 Página Livre",
    titulo: "A-2 - Página Livre",
    desativado: false,
    chaves: ["pagina livre", "página livre"],
    aliases: []
  },
  {
    codigo: "A-3",
    nome: "A-3 Entre Nós",
    titulo: "A-3 - Entre Nós",
    desativado: false,
    chaves: ["entre nos", "entre nós"],
    aliases: []
  },
  {
    codigo: "A-4",
    nome: "A-4 Sussurros da Aurora",
    titulo: "A-4 - Sussurros da Aurora",
    desativado: false,
    chaves: ["sussurros da aurora"],
    aliases: []
  },
  {
    codigo: "A-5",
    nome: "A-5 Crepúsculo",
    titulo: "A-5 - Crepúsculo",
    desativado: false,
    chaves: ["crepusculo", "crepúsculo"],
    aliases: []
  },
  {
    codigo: "A-6",
    nome: "A-6 Trono Profano",
    titulo: "A-6 - Trono Profano",
    desativado: false,
    chaves: ["trono profano"],
    aliases: []
  },
  {
    codigo: "A-7",
    nome: "A-7 Margens de Mundos",
    titulo: "A-7 - Margens de Mundos",
    desativado: false,
    chaves: ["margens de mundos"],
    aliases: []
  },
  {
    codigo: "A-8",
    nome: "A-8 Ordem do Eclipse",
    titulo: "A-8 - Ordem do Eclipse",
    desativado: false,
    chaves: ["ordem do eclipse"],
    aliases: []
  },
  {
    codigo: "A-9",
    nome: "A-9 Cicatrizes Literárias",
    titulo: "A-9 - Cicatrizes Literárias",
    desativado: false,
    chaves: ["cicatrizes literarias", "cicatrizes literárias"],
    aliases: []
  },
  {
    codigo: "A-10",
    nome: "A-10 Quasar",
    titulo: "A-10 - Quasar",
    desativado: false,
    chaves: ["quasar"],
    aliases: []
  },
  {
    codigo: "A-11",
    nome: "A-11 Sussurros Infinitos",
    titulo: "A-11 - Sussurros Infinitos",
    desativado: false,
    chaves: ["sussurros infinitos"],
    aliases: []
  },
  {
    codigo: "A-12",
    nome: "A-12 Estrela Polar",
    titulo: "A-12 - Estrela Polar",
    desativado: false,
    chaves: ["estrela polar"],
    aliases: []
  },
  {
    codigo: "A-13",
    nome: "A-13 Luar Profano",
    titulo: "A-13 - Luar Profano",
    desativado: false,
    chaves: ["luar profano"],
    aliases: []
  },
  {
    codigo: "A-14",
    nome: "A-14 Fragmentos da Noite",
    titulo: "A-14 - Fragmentos da Noite",
    desativado: false,
    chaves: ["fragmentos da noite"],
    aliases: []
  },
  {
    codigo: "A-15",
    nome: "A-15 Santuário Lunar",
    titulo: "A-15 - Santuário Lunar",
    desativado: false,
    chaves: [
      "santuario lunar",
      "santuário lunar",
      "veu escarlate",
      "véu escarlate"
    ],
    aliases: ["A-15 Véu Escarlate"]
  },
  {
    codigo: "A-16",
    nome: "A-16 Rose Noire",
    titulo: "A-16 - Rose Noire",
    desativado: false,
    chaves: ["rose noire"],
    aliases: []
  },
  {
    codigo: "A-17",
    nome: "A-17 Lâmina Sombria",
    titulo: "A-17 - Lâmina Sombria",
    desativado: false,
    chaves: ["lamina sombria", "lâmina sombria"],
    aliases: []
  },
  {
    codigo: "A-18",
    nome: "A-18 Horizonte Astral",
    titulo: "A-18 - Horizonte Astral",
    desativado: false,
    chaves: ["horizonte astral"],
    aliases: []
  },
  {
    codigo: "A-19",
    nome: "A-19 Luar Sereno",
    titulo: "A-19 - Luar Sereno",
    desativado: false,
    chaves: ["luar sereno"],
    aliases: []
  }
];

function normalizarTextoSub(texto) {
  return String(texto || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizarNomeSub(nomeSub) {
  const valor = String(nomeSub || "").trim();

  if (!valor) {
    return "";
  }

  const valorComparavel = normalizarTextoSub(valor);

  const subEncontrado = SUBS_OFICIAIS.find((sub) => {
    const nomes = [sub.nome, ...sub.aliases];

    return nomes.some((nome) => normalizarTextoSub(nome) === valorComparavel);
  });

  return subEncontrado?.nome || valor;
}

export function obterSubOficial(nomeSub) {
  const nomeNormalizado = normalizarNomeSub(nomeSub);

  return SUBS_OFICIAIS.find((sub) => sub.nome === nomeNormalizado) || null;
}

export function obterTituloSub(nomeSub) {
  const subEncontrado = obterSubOficial(nomeSub);

  return subEncontrado?.titulo || nomeSub || "Sub não informado";
}

export function obterNomesEquivalentesSub(nomeSub) {
  const subEncontrado = obterSubOficial(nomeSub);

  if (!subEncontrado) {
    const valor = String(nomeSub || "").trim();
    return valor ? [valor] : [];
  }

  return [subEncontrado.nome, ...subEncontrado.aliases];
}
