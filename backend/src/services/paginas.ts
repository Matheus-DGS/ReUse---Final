// Consultas agregadas para as telas do frontend (padrão BFF — Backend For Frontend).
//
// Cada tela do Next.js carrega tudo o que precisa em UMA chamada HTTP, em vez de disparar
// cinco ou seis requisições em sequência. As rotas REST de `/api/pontos`, `/api/items` e
// `/api/ranking` continuam existindo para consumo externo (app mobile, integrações).

import { prisma } from "@/lib/prisma";
import { erro } from "@/lib/http";
import { ehCategoria } from "@/dominio/categorias";
import { inicioDoDiaSP, missaoDoDia } from "@/dominio/gamificacao";
import { estatisticasDoUsuario, rankingDeUsuarios } from "@/services/impacto";
import { listarPontos, pontoPorId } from "@/services/pontos";
import { itemPorId, listarItens } from "@/services/materiais";
import { estaFavoritado, listarFavoritos } from "@/services/favoritos";

/** Quantas vezes o usuário já cumpriu a missão de hoje (0 = missão em aberto). */
function missaoCumpridaHoje(usuarioId: string | null) {
  if (!usuarioId) return Promise.resolve(0);
  return prisma.descarte.count({
    where: { usuarioId, categoria: missaoDoDia().categoria, data: { gte: inicioDoDiaSP() } },
  });
}

export async function paginaInicio(usuarioId: string | null) {
  const [itensRecentes, totalItens, pontos, totalDescartes, totalUsuarios, top3, missaoCumprida] = await Promise.all([
    listarItens({ limite: 3 }),
    prisma.item.count(),
    listarPontos(),
    prisma.descarte.count(),
    prisma.usuario.count(),
    rankingDeUsuarios("mes", 3),
    missaoCumpridaHoje(usuarioId),
  ]);

  return {
    itensRecentes,
    pontos,
    top3,
    totais: { itens: totalItens, pontos: pontos.length, descartes: totalDescartes, usuarios: totalUsuarios },
    missaoCumprida: missaoCumprida > 0,
  };
}

export async function paginaPontos(usuarioId: string | null) {
  const [pontos, totalDescartes, missaoCumprida] = await Promise.all([
    listarPontos(),
    prisma.descarte.count(),
    missaoCumpridaHoje(usuarioId),
  ]);

  return {
    pontos,
    totalDescartes,
    sugeridos: pontos.filter((p) => !p.verificado).length,
    missaoCumprida: missaoCumprida > 0,
  };
}

export async function paginaPonto(id: string, usuarioId: string | null) {
  const [ponto, descartesHoje] = await Promise.all([
    pontoPorId(id),
    usuarioId
      ? prisma.descarte.count({ where: { usuarioId, data: { gte: inicioDoDiaSP() } } })
      : Promise.resolve(0),
  ]);

  return { ponto, descartesHoje };
}

export async function paginaMateriais(filtros: { categoria?: string | null; q?: string | null }) {
  const itens = await listarItens(filtros);
  return { itens, total: itens.length };
}

export async function paginaMaterial(id: string, usuarioId: string | null) {
  const item = await itemPorId(id);

  const [favoritado, pontosQueAceitam, totalPontos] = await Promise.all([
    usuarioId ? estaFavoritado(usuarioId, item.id) : Promise.resolve(false),
    prisma.pontoColeta.findMany({
      where: { materiais: { has: item.categoria } },
      orderBy: [{ verificado: "desc" }, { descartes: { _count: "desc" } }],
      take: 3,
      select: { id: true, nome: true, bairro: true, tipo: true, horario: true },
    }),
    prisma.pontoColeta.count({ where: { materiais: { has: item.categoria } } }),
  ]);

  return { item, favoritado, pontosQueAceitam, totalPontos };
}

export async function paginaPerfil(usuarioId: string) {
  const [impacto, historico, ranking, missaoCumprida] = await Promise.all([
    estatisticasDoUsuario(usuarioId),
    prisma.descarte.findMany({
      where: { usuarioId },
      orderBy: { data: "desc" },
      take: 8,
      select: {
        id: true,
        categoria: true,
        quantidade: true,
        pontos: true,
        data: true,
        ponto: { select: { id: true, nome: true, bairro: true } },
      },
    }),
    rankingDeUsuarios("geral", 1000),
    missaoCumpridaHoje(usuarioId),
  ]);

  return {
    ...impacto,
    historico,
    posicao: ranking.find((r) => r.usuarioId === usuarioId)?.posicao ?? null,
    missaoCumprida: missaoCumprida > 0,
  };
}

export async function paginaFavoritos(usuarioId: string) {
  const favoritos = await listarFavoritos(usuarioId);
  return { favoritos };
}

/** Catálogo filtrado por categoria, validando o filtro recebido na query string. */
export function categoriaValida(valor: unknown) {
  return ehCategoria(valor) ? valor : null;
}

export function exigirId(valor: unknown) {
  const id = String(valor ?? "").trim();
  if (!id) throw erro(400, "Informe o identificador do registro.");
  return id;
}
