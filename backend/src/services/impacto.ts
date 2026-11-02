// Consultas (Prisma) que alimentam a gamificação: perfil de impacto e ranking.

import { prisma } from "@/lib/prisma";
import { nomePublico } from "@/dominio/nomes";
import { CHAVES_CATEGORIA, type CategoriaKey } from "@/dominio/categorias";
import {
  PONTOS_MATERIAL_CATALOGO,
  PONTOS_SUGESTAO_PONTO,
  calcularNivel,
  chaveDiaSP,
  inicioDoMesSP,
  type EstatisticasUsuario,
} from "@/dominio/gamificacao";

export async function estatisticasDoUsuario(usuarioId: string) {
  const [descartes, pontosSugeridos, materiaisCadastrados, favoritos] = await Promise.all([
    prisma.descarte.findMany({
      where: { usuarioId },
      select: { categoria: true, quantidade: true, pontos: true, data: true, pontoId: true },
    }),
    prisma.pontoColeta.count({ where: { criadoPorId: usuarioId } }),
    prisma.item.count({ where: { usuarioId } }),
    prisma.favorito.count({ where: { usuarioId } }),
  ]);

  const porCategoria = Object.fromEntries(CHAVES_CATEGORIA.map((c) => [c, 0])) as Record<
    CategoriaKey,
    number
  >;
  for (const d of descartes) porCategoria[d.categoria] += d.quantidade;

  const pontosDescartes = descartes.reduce((soma, d) => soma + d.pontos, 0);
  const totalPontos =
    pontosDescartes +
    pontosSugeridos * PONTOS_SUGESTAO_PONTO +
    materiaisCadastrados * PONTOS_MATERIAL_CATALOGO;

  const estatisticas: EstatisticasUsuario = {
    totalPontos,
    totalDescartes: descartes.length,
    categoriasDistintas: Object.values(porCategoria).filter((q) => q > 0).length,
    pontosVisitados: new Set(descartes.map((d) => d.pontoId)).size,
    diasAtivos: new Set(descartes.map((d) => chaveDiaSP(d.data))).size,
    descartouEletronico: porCategoria.ELETRONICO > 0,
    pontosSugeridos,
    materiaisCadastrados,
    favoritos,
  };

  return {
    estatisticas,
    porCategoria,
    volumesTotais: descartes.reduce((soma, d) => soma + d.quantidade, 0),
    nivel: calcularNivel(totalPontos),
  };
}

export type Periodo = "geral" | "mes";

export async function rankingDeUsuarios(periodo: Periodo, limite = 10) {
  const desde = periodo === "mes" ? inicioDoMesSP() : undefined;

  const [descartes, sugestoes, materiais] = await Promise.all([
    prisma.descarte.groupBy({
      by: ["usuarioId"],
      where: desde ? { data: { gte: desde } } : undefined,
      _sum: { pontos: true },
      _count: { _all: true },
    }),
    prisma.pontoColeta.groupBy({
      by: ["criadoPorId"],
      where: { criadoPorId: { not: null }, ...(desde ? { dataCadastro: { gte: desde } } : {}) },
      _count: { _all: true },
    }),
    prisma.item.groupBy({
      by: ["usuarioId"],
      where: desde ? { dataPublicacao: { gte: desde } } : undefined,
      _count: { _all: true },
    }),
  ]);

  const placar = new Map<string, { pontos: number; descartes: number }>();
  const somar = (id: string, pontos: number, qtdDescartes = 0) => {
    const atual = placar.get(id) ?? { pontos: 0, descartes: 0 };
    placar.set(id, { pontos: atual.pontos + pontos, descartes: atual.descartes + qtdDescartes });
  };

  descartes.forEach((d) => somar(d.usuarioId, d._sum.pontos ?? 0, d._count._all));
  sugestoes.forEach((s) => s.criadoPorId && somar(s.criadoPorId, s._count._all * PONTOS_SUGESTAO_PONTO));
  materiais.forEach((m) => somar(m.usuarioId, m._count._all * PONTOS_MATERIAL_CATALOGO));

  const ordenados = [...placar.entries()]
    .filter(([, v]) => v.pontos > 0)
    .sort((a, b) => b[1].pontos - a[1].pontos)
    .slice(0, limite);

  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: ordenados.map(([id]) => id) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));

  return ordenados.map(([id, v], i) => ({
    posicao: i + 1,
    usuarioId: id,
    nome: nomePublico(nomes.get(id) ?? "Usuário"),
    pontos: v.pontos,
    descartes: v.descartes,
  }));
}
