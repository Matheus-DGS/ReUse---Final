// Favoritos do usuário (entidade Favorito do modelo de dados).

import { prisma } from "@/lib/prisma";
import { erro } from "@/lib/http";

export function listarFavoritos(usuarioId: string) {
  return prisma.favorito.findMany({
    where: { usuarioId },
    orderBy: { dataFavorito: "desc" },
    select: {
      id: true,
      dataFavorito: true,
      item: {
        select: {
          id: true,
          nomeItem: true,
          descricao: true,
          categoria: true,
          fotos: { orderBy: { principal: "desc" }, select: { urlFoto: true, principal: true } },
        },
      },
    },
  });
}

export async function favoritar(usuarioId: string, itemId: string) {
  if (!itemId) throw erro(400, "Informe o material a favoritar.");

  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) throw erro(404, "Material não encontrado.");

  // upsert: favoritar duas vezes não gera erro nem duplica o registro
  return prisma.favorito.upsert({
    where: { usuarioId_itemId: { usuarioId, itemId } },
    update: {},
    create: { usuarioId, itemId },
    select: { id: true, itemId: true, dataFavorito: true },
  });
}

export async function desfavoritar(usuarioId: string, itemId: string) {
  if (!itemId) throw erro(400, "Informe o material a remover.");
  await prisma.favorito.deleteMany({ where: { usuarioId, itemId } });
}

export async function estaFavoritado(usuarioId: string, itemId: string) {
  const favorito = await prisma.favorito.findUnique({
    where: { usuarioId_itemId: { usuarioId, itemId } },
    select: { id: true },
  });
  return Boolean(favorito);
}
