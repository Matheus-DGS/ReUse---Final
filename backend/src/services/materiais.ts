// Catálogo de materiais recicláveis (entidades Item e FotoItem do modelo de dados).

import { prisma } from "@/lib/prisma";
import { erro } from "@/lib/http";
import { ehCategoria } from "@/dominio/categorias";

const SELECAO = {
  id: true,
  nomeItem: true,
  descricao: true,
  categoria: true,
  dataPublicacao: true,
  usuarioId: true,
  fotos: { orderBy: { principal: "desc" } as const, select: { id: true, urlFoto: true, principal: true } },
} as const;

export async function listarItens({ categoria, q, limite }: { categoria?: string | null; q?: string | null; limite?: number } = {}) {
  const busca = q?.trim();

  return prisma.item.findMany({
    where: {
      ...(ehCategoria(categoria) ? { categoria } : {}),
      ...(busca
        ? {
            OR: [
              { nomeItem: { contains: busca, mode: "insensitive" as const } },
              { descricao: { contains: busca, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { dataPublicacao: "desc" },
    ...(limite ? { take: limite } : {}),
    select: SELECAO,
  });
}

export async function itemPorId(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    select: { ...SELECAO, usuario: { select: { nome: true } } },
  });
  if (!item) throw erro(404, "Material não encontrado.");
  return item;
}

export type DadosNovoItem = {
  nomeItem: string;
  descricao: string;
  categoria: string;
  urlFoto?: string;
};

export async function criarItem(usuarioId: string, dados: DadosNovoItem) {
  const nomeItem = String(dados.nomeItem ?? "").trim();
  const descricao = String(dados.descricao ?? "").trim();
  const urlFoto = String(dados.urlFoto ?? "").trim();

  if (nomeItem.length < 3) throw erro(400, "O nome do material precisa ter ao menos 3 caracteres.");
  if (descricao.length < 10) throw erro(400, "Descreva o material e como descartá-lo (mínimo de 10 caracteres).");
  if (!ehCategoria(dados.categoria)) throw erro(400, "Escolha uma categoria.");
  if (urlFoto && !/^https:\/\/\S+$/i.test(urlFoto)) throw erro(400, "A foto deve ser um link começando com https://");

  return prisma.item.create({
    data: {
      nomeItem: nomeItem.slice(0, 80),
      descricao: descricao.slice(0, 600),
      categoria: dados.categoria,
      usuarioId,
      fotos: urlFoto ? { create: [{ urlFoto, principal: true }] } : undefined,
    },
    select: SELECAO,
  });
}

/** Remove um material. Só o autor — ou a administração — pode apagar. */
export async function removerItem(id: string, usuario: { id: string; papel: string }) {
  const item = await prisma.item.findUnique({ where: { id }, select: { usuarioId: true } });
  if (!item) throw erro(404, "Material não encontrado.");
  if (item.usuarioId !== usuario.id && usuario.papel !== "ADMIN") {
    throw erro(403, "Você não tem permissão para remover este material.");
  }
  await prisma.item.delete({ where: { id } });
}
