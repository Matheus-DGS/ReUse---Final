// Cores seguem o padrão da coleta seletiva (Resolução CONAMA nº 275/2001)
export const CATEGORIAS = {
  PAPEL: {
    label: "Papel",
    cor: "var(--papel-azul)",
    dica: "Papéis e papelão limpos e secos. Desmonte as caixas para ocupar menos espaço.",
  },
  PLASTICO: {
    label: "Plástico",
    cor: "var(--plastico-vermelho)",
    dica: "Enxágue garrafas e embalagens e amasse para reduzir o volume.",
  },
  VIDRO: {
    label: "Vidro",
    cor: "var(--vidro-verde)",
    dica: "Potes e garrafas sem tampa. Vidro quebrado deve ir embrulhado em jornal.",
  },
  METAL: {
    label: "Metal",
    cor: "var(--metal-amarelo)",
    dica: "Latas lavadas e amassadas. Tampas metálicas também são recicláveis.",
  },
  ORGANICO: {
    label: "Orgânico",
    cor: "var(--organico-marrom)",
    dica: "Restos de frutas, verduras e borra de café viram adubo na compostagem.",
  },
  ELETRONICO: {
    label: "Eletrônico",
    cor: "var(--eletronico-laranja)",
    dica: "Pilhas, baterias, cabos e aparelhos nunca vão no lixo comum — contêm metais pesados.",
  },
} as const;

export type CategoriaKey = keyof typeof CATEGORIAS;

export const CHAVES_CATEGORIA = Object.keys(CATEGORIAS) as CategoriaKey[];

export function ehCategoria(valor: unknown): valor is CategoriaKey {
  return typeof valor === "string" && valor in CATEGORIAS;
}

export function infoCategoria(categoria: string) {
  return ehCategoria(categoria)
    ? CATEGORIAS[categoria]
    : { label: categoria, cor: "var(--tinta-suave)", dica: "" };
}
