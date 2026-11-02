// Regras de gamificação do ReUse! — baseadas no "Plano de Animações e Gamificação".
// Funções puras (sem banco): podem ser usadas no servidor e no cliente.

import { CATEGORIAS, CHAVES_CATEGORIA, type CategoriaKey } from "./categorias";

/** EcoPontos por volume descartado (sacola/caixa) de cada categoria. */
export const PONTOS_POR_CATEGORIA: Record<CategoriaKey, number> = {
  PAPEL: 5,
  PLASTICO: 5,
  ORGANICO: 4,
  VIDRO: 8,
  METAL: 8,
  ELETRONICO: 15,
};

export const BONUS_MISSAO = 20;
export const BONUS_NOVO_PONTO_VISITADO = 10;
export const PONTOS_SUGESTAO_PONTO = 30;
export const PONTOS_MATERIAL_CATALOGO = 10;
export const LIMITE_DESCARTES_DIA = 5;
export const QUANTIDADE_MAXIMA = 5;

export const NIVEIS = [
  { nome: "Semente", minimo: 0, simbolo: "•" },
  { nome: "Broto", minimo: 60, simbolo: "⁂" },
  { nome: "Muda", minimo: 180, simbolo: "✿" },
  { nome: "Árvore", minimo: 400, simbolo: "♣" },
  { nome: "Floresta", minimo: 800, simbolo: "✺" },
] as const;

export function calcularNivel(total: number) {
  let indice = 0;
  NIVEIS.forEach((n, i) => {
    if (total >= n.minimo) indice = i;
  });
  const atual = NIVEIS[indice];
  const proximo = NIVEIS[indice + 1] ?? null;
  const progresso = proximo
    ? Math.min(1, (total - atual.minimo) / (proximo.minimo - atual.minimo))
    : 1;

  return {
    numero: indice + 1,
    nome: atual.nome,
    simbolo: atual.simbolo,
    proximo,
    faltam: proximo ? proximo.minimo - total : 0,
    progresso,
  };
}

// ---------- Datas no fuso de São Paulo (o servidor na Vercel roda em UTC) ----------

const FUSO_SP_HORAS = 3; // UTC-3, sem horário de verão desde 2019

export function inicioDoDiaSP(data = new Date()) {
  const local = new Date(data.getTime() - FUSO_SP_HORAS * 3600_000);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), FUSO_SP_HORAS)
  );
}

export function inicioDoMesSP(data = new Date()) {
  const local = new Date(data.getTime() - FUSO_SP_HORAS * 3600_000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1, FUSO_SP_HORAS));
}

export function chaveDiaSP(data: Date) {
  return inicioDoDiaSP(data).toISOString().slice(0, 10);
}

// ---------- Missão diária ----------

/** A missão muda todo dia, alternando a categoria em destaque. */
export function missaoDoDia(data = new Date()) {
  const dias = Math.floor(inicioDoDiaSP(data).getTime() / 86_400_000);
  const categoria = CHAVES_CATEGORIA[dias % CHAVES_CATEGORIA.length];
  return {
    categoria,
    titulo: `Descarte ${CATEGORIAS[categoria].label.toLowerCase()} hoje`,
    descricao: `Registre um descarte de ${CATEGORIAS[categoria].label.toLowerCase()} em qualquer ponto e ganhe +${BONUS_MISSAO} EcoPontos.`,
    bonus: BONUS_MISSAO,
  };
}

// ---------- Conquistas (badges) ----------

export type EstatisticasUsuario = {
  totalPontos: number;
  totalDescartes: number;
  categoriasDistintas: number;
  pontosVisitados: number;
  diasAtivos: number;
  descartouEletronico: boolean;
  pontosSugeridos: number;
  materiaisCadastrados: number;
  favoritos: number;
};

export const CONQUISTAS: {
  id: string;
  titulo: string;
  descricao: string;
  simbolo: string;
  atingiu: (e: EstatisticasUsuario) => boolean;
}[] = [
  {
    id: "primeiro-passo",
    titulo: "Primeiro passo",
    descricao: "Registre seu primeiro descarte.",
    simbolo: "①",
    atingiu: (e) => e.totalDescartes >= 1,
  },
  {
    id: "separador-nato",
    titulo: "Separador nato",
    descricao: "Descarte 4 categorias diferentes de material.",
    simbolo: "◆",
    atingiu: (e) => e.categoriasDistintas >= 4,
  },
  {
    id: "explorador",
    titulo: "Explorador urbano",
    descricao: "Faça descartes em 3 pontos de coleta diferentes.",
    simbolo: "⌖",
    atingiu: (e) => e.pontosVisitados >= 3,
  },
  {
    id: "habito-verde",
    titulo: "Hábito verde",
    descricao: "Descarte em 3 dias diferentes.",
    simbolo: "↻",
    atingiu: (e) => e.diasAtivos >= 3,
  },
  {
    id: "e-lixo",
    titulo: "Caçador de e-lixo",
    descricao: "Leve um eletrônico, pilha ou bateria a um ponto adequado.",
    simbolo: "ϟ",
    atingiu: (e) => e.descartouEletronico,
  },
  {
    id: "mapeador",
    titulo: "Mapeador",
    descricao: "Sugira um novo ponto de coleta para a comunidade.",
    simbolo: "✚",
    atingiu: (e) => e.pontosSugeridos >= 1,
  },
  {
    id: "curador",
    titulo: "Curador",
    descricao: "Cadastre um material no catálogo.",
    simbolo: "❏",
    atingiu: (e) => e.materiaisCadastrados >= 1,
  },
  {
    id: "colecionador",
    titulo: "Colecionador",
    descricao: "Salve 5 materiais nos favoritos.",
    simbolo: "★",
    atingiu: (e) => e.favoritos >= 5,
  },
  {
    id: "centenario",
    titulo: "Cem EcoPontos",
    descricao: "Acumule 100 EcoPontos.",
    simbolo: "C",
    atingiu: (e) => e.totalPontos >= 100,
  },
];

export function conquistasAtingidas(e: EstatisticasUsuario) {
  return CONQUISTAS.filter((c) => c.atingiu(e)).map((c) => c.id);
}
