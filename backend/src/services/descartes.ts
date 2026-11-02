// Regra de negócio do registro de descarte, compartilhada pelo formulário (Server Action)
// e pelo assistente virtual Eco (IBM Watson).

import { prisma } from "@/lib/prisma";
import { ehCategoria, infoCategoria } from "@/dominio/categorias";
import {
  BONUS_MISSAO,
  BONUS_NOVO_PONTO_VISITADO,
  CONQUISTAS,
  LIMITE_DESCARTES_DIA,
  PONTOS_POR_CATEGORIA,
  QUANTIDADE_MAXIMA,
  conquistasAtingidas,
  inicioDoDiaSP,
  missaoDoDia,
} from "@/dominio/gamificacao";
import { estatisticasDoUsuario } from "@/services/impacto";

export type DescarteRegistrado = {
  status: "sucesso";
  id: string;
  pontoId: string;
  categoria: string;
  pontosGanhos: number;
  bonus: { rotulo: string; pontos: number }[];
  totalPontos: number;
  nivelAntes: string;
  nivelDepois: string;
  subiuDeNivel: boolean;
  progresso: number;
  faltam: number;
  proximoNivel: string | null;
  novasConquistas: { titulo: string; simbolo: string }[];
};

export type FalhaDescarte = { status: "erro"; mensagem: string };

export async function registrarDescarteDoUsuario(
  usuarioId: string,
  dados: { pontoId: string; categoria: unknown; quantidade: number }
): Promise<DescarteRegistrado | FalhaDescarte> {
  const { pontoId, categoria, quantidade } = dados;

  if (!ehCategoria(categoria)) return { status: "erro", mensagem: "Escolha o material descartado." };
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > QUANTIDADE_MAXIMA) {
    return { status: "erro", mensagem: `Informe entre 1 e ${QUANTIDADE_MAXIMA} volumes.` };
  }

  const ponto = await prisma.pontoColeta.findUnique({
    where: { id: pontoId },
    select: { id: true, materiais: true },
  });
  if (!ponto) return { status: "erro", mensagem: "Ponto de coleta não encontrado." };
  if (!ponto.materiais.includes(categoria)) {
    return {
      status: "erro",
      mensagem: `Este ponto não recebe ${infoCategoria(categoria).label.toLowerCase()}. Procure outro ponto no mapa.`,
    };
  }

  const hoje = inicioDoDiaSP();
  const [descartesHoje, jaVisitou] = await Promise.all([
    prisma.descarte.findMany({ where: { usuarioId, data: { gte: hoje } }, select: { categoria: true } }),
    prisma.descarte.findFirst({ where: { usuarioId, pontoId: ponto.id }, select: { id: true } }),
  ]);

  // Regra anti-abuso: limite diário de registros
  if (descartesHoje.length >= LIMITE_DESCARTES_DIA) {
    return {
      status: "erro",
      mensagem: `Você já registrou ${LIMITE_DESCARTES_DIA} descartes hoje. Volte amanhã para somar mais EcoPontos!`,
    };
  }

  const antes = await estatisticasDoUsuario(usuarioId);

  const bonus: { rotulo: string; pontos: number }[] = [];
  const missao = missaoDoDia();
  const missaoJaCumprida = descartesHoje.some((d) => d.categoria === missao.categoria);
  if (categoria === missao.categoria && !missaoJaCumprida) {
    bonus.push({ rotulo: "Missão do dia", pontos: BONUS_MISSAO });
  }
  if (!jaVisitou) bonus.push({ rotulo: "Novo ponto visitado", pontos: BONUS_NOVO_PONTO_VISITADO });

  const base = PONTOS_POR_CATEGORIA[categoria] * quantidade;
  const pontosGanhos = base + bonus.reduce((s, b) => s + b.pontos, 0);

  const descarte = await prisma.descarte.create({
    data: { usuarioId, pontoId: ponto.id, categoria, quantidade, pontos: pontosGanhos },
  });

  const depois = await estatisticasDoUsuario(usuarioId);
  const conquistasAntes = new Set(conquistasAtingidas(antes.estatisticas));
  const novasConquistas = CONQUISTAS.filter(
    (c) => c.atingiu(depois.estatisticas) && !conquistasAntes.has(c.id)
  ).map((c) => ({ titulo: c.titulo, simbolo: c.simbolo }));

  return {
    status: "sucesso",
    id: descarte.id,
    pontoId: ponto.id,
    categoria,
    pontosGanhos,
    bonus,
    totalPontos: depois.estatisticas.totalPontos,
    nivelAntes: antes.nivel.nome,
    nivelDepois: depois.nivel.nome,
    subiuDeNivel: depois.nivel.numero > antes.nivel.numero,
    progresso: depois.nivel.progresso,
    faltam: depois.nivel.faltam,
    proximoNivel: depois.nivel.proximo?.nome ?? null,
    novasConquistas,
  };
}

/** Janela para desfazer um registro feito por engano. */
export const MINUTOS_PARA_DESFAZER = 30;

export async function ultimoDescarteDesfazivel(usuarioId: string) {
  const limite = new Date(Date.now() - MINUTOS_PARA_DESFAZER * 60_000);
  return prisma.descarte.findFirst({
    where: { usuarioId, data: { gte: limite } },
    orderBy: { data: "desc" },
    include: { ponto: { select: { id: true, nome: true } } },
  });
}
