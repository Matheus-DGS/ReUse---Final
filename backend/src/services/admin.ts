// Área administrativa da plataforma (fase 06).
//
// Reúne as métricas e as ações de moderação que a equipe do ReUse! precisa: aprovar os pontos
// sugeridos pela comunidade, cuidar do catálogo, acompanhar a gamificação e gerenciar contas.

import type { Papel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { erro } from "@/lib/http";
import { CHAVES_CATEGORIA, ehCategoria, type CategoriaKey } from "@/dominio/categorias";
import { ehTipoPonto } from "@/dominio/pontos";
import { chaveDiaSP, inicioDoDiaSP, inicioDoMesSP } from "@/dominio/gamificacao";

const DIAS_NO_GRAFICO = 14;

export async function painel() {
  const hoje = inicioDoDiaSP();
  const mes = inicioDoMesSP();
  const desde = new Date(hoje.getTime() - (DIAS_NO_GRAFICO - 1) * 86_400_000);

  const [
    usuarios,
    admins,
    pontos,
    verificados,
    materiais,
    descartes,
    descartesHoje,
    descartesMes,
    somas,
    porCategoria,
    porTipo,
    recentes,
    pendentes,
    topPontos,
    ultimosUsuarios,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { papel: "ADMIN" } }),
    prisma.pontoColeta.count(),
    prisma.pontoColeta.count({ where: { verificado: true } }),
    prisma.item.count(),
    prisma.descarte.count(),
    prisma.descarte.count({ where: { data: { gte: hoje } } }),
    prisma.descarte.count({ where: { data: { gte: mes } } }),
    prisma.descarte.aggregate({ _sum: { pontos: true, quantidade: true } }),
    prisma.descarte.groupBy({ by: ["categoria"], _sum: { quantidade: true, pontos: true }, _count: { _all: true } }),
    prisma.pontoColeta.groupBy({ by: ["tipo"], _count: { _all: true } }),
    prisma.descarte.findMany({
      where: { data: { gte: desde } },
      select: { data: true, quantidade: true },
    }),
    prisma.pontoColeta.findMany({
      where: { verificado: false },
      orderBy: { dataCadastro: "desc" },
      select: {
        id: true,
        nome: true,
        tipo: true,
        bairro: true,
        cidade: true,
        materiais: true,
        dataCadastro: true,
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    }),
    prisma.pontoColeta.findMany({
      orderBy: { descartes: { _count: "desc" } },
      take: 5,
      select: { id: true, nome: true, bairro: true, tipo: true, verificado: true, _count: { select: { descartes: true } } },
    }),
    prisma.usuario.findMany({
      orderBy: { dataCadastro: "desc" },
      take: 5,
      select: { id: true, nome: true, email: true, papel: true, dataCadastro: true },
    }),
  ]);

  // Série diária dos últimos 14 dias, já no fuso de São Paulo e sem buracos
  const volumesPorDia = new Map<string, { descartes: number; volumes: number }>();
  for (let i = 0; i < DIAS_NO_GRAFICO; i++) {
    const dia = new Date(desde.getTime() + i * 86_400_000);
    volumesPorDia.set(chaveDiaSP(dia), { descartes: 0, volumes: 0 });
  }
  for (const d of recentes) {
    const chave = chaveDiaSP(d.data);
    const atual = volumesPorDia.get(chave);
    if (atual) {
      atual.descartes += 1;
      atual.volumes += d.quantidade;
    }
  }

  const categorias = CHAVES_CATEGORIA.map((categoria) => {
    const linha = porCategoria.find((c) => c.categoria === categoria);
    return {
      categoria,
      descartes: linha?._count._all ?? 0,
      volumes: linha?._sum.quantidade ?? 0,
      pontos: linha?._sum.pontos ?? 0,
    };
  });

  return {
    totais: {
      usuarios,
      admins,
      pontos,
      verificados,
      pendentes: pontos - verificados,
      materiais,
      descartes,
      descartesHoje,
      descartesMes,
      ecopontosDistribuidos: somas._sum.pontos ?? 0,
      volumesDestinados: somas._sum.quantidade ?? 0,
    },
    categorias,
    tipos: porTipo.map((t) => ({ tipo: t.tipo, total: t._count._all })),
    serie: [...volumesPorDia.entries()].map(([dia, v]) => ({ dia, ...v })),
    pendentes,
    topPontos: topPontos.map(({ _count, ...p }) => ({ ...p, totalDescartes: _count.descartes })),
    ultimosUsuarios,
  };
}

// ------------------------------------------------------------------ pontos de coleta

export type FiltroStatus = "todos" | "verificados" | "pendentes";

export async function listarPontosAdmin({ q, status = "todos" }: { q?: string | null; status?: FiltroStatus } = {}) {
  const busca = q?.trim();

  const pontos = await prisma.pontoColeta.findMany({
    where: {
      ...(status === "verificados" ? { verificado: true } : {}),
      ...(status === "pendentes" ? { verificado: false } : {}),
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: "insensitive" as const } },
              { bairro: { contains: busca, mode: "insensitive" as const } },
              { endereco: { contains: busca, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ verificado: "asc" }, { dataCadastro: "desc" }],
    include: {
      criadoPor: { select: { id: true, nome: true, email: true } },
      _count: { select: { descartes: true } },
    },
  });

  return pontos.map(({ _count, criadoPorId, ...p }) => ({ ...p, totalDescartes: _count.descartes }));
}

export type AlteracaoPonto = {
  verificado?: unknown;
  nome?: unknown;
  descricao?: unknown;
  tipo?: unknown;
  endereco?: unknown;
  bairro?: unknown;
  cidade?: unknown;
  horario?: unknown;
  telefone?: unknown;
  materiais?: unknown;
};

export async function atualizarPonto(id: string, alteracoes: AlteracaoPonto) {
  const existe = await prisma.pontoColeta.findUnique({ where: { id }, select: { id: true } });
  if (!existe) throw erro(404, "Ponto de coleta não encontrado.");

  const dados: Record<string, unknown> = {};

  if (alteracoes.verificado !== undefined) dados.verificado = Boolean(alteracoes.verificado);
  if (alteracoes.nome !== undefined) {
    const nome = String(alteracoes.nome).trim();
    if (nome.length < 3) throw erro(400, "O nome do ponto precisa ter ao menos 3 caracteres.");
    dados.nome = nome;
  }
  if (alteracoes.tipo !== undefined) {
    if (!ehTipoPonto(alteracoes.tipo)) throw erro(400, "Tipo de ponto inválido.");
    dados.tipo = alteracoes.tipo;
  }
  if (alteracoes.materiais !== undefined) {
    const materiais = (Array.isArray(alteracoes.materiais) ? alteracoes.materiais : []).filter(ehCategoria);
    if (materiais.length === 0) throw erro(400, "O ponto precisa aceitar ao menos um material.");
    dados.materiais = materiais;
  }
  for (const campo of ["descricao", "endereco", "bairro", "cidade", "horario"] as const) {
    if (alteracoes[campo] !== undefined) {
      const valor = String(alteracoes[campo]).trim();
      if (!valor) throw erro(400, `O campo ${campo} não pode ficar vazio.`);
      dados[campo] = valor;
    }
  }
  if (alteracoes.telefone !== undefined) dados.telefone = String(alteracoes.telefone).trim() || null;

  if (Object.keys(dados).length === 0) throw erro(400, "Nenhuma alteração informada.");

  return prisma.pontoColeta.update({
    where: { id },
    data: dados,
    select: { id: true, nome: true, verificado: true },
  });
}

export async function removerPonto(id: string) {
  const ponto = await prisma.pontoColeta.findUnique({
    where: { id },
    select: { id: true, nome: true, _count: { select: { descartes: true } } },
  });
  if (!ponto) throw erro(404, "Ponto de coleta não encontrado.");

  // Apagar o ponto apaga os descartes ligados a ele (onDelete: Cascade) e, com eles, EcoPontos
  await prisma.pontoColeta.delete({ where: { id } });
  return { nome: ponto.nome, descartesRemovidos: ponto._count.descartes };
}

// ------------------------------------------------------------------ usuários

export async function listarUsuarios({ q }: { q?: string | null } = {}) {
  const busca = q?.trim();

  const usuarios = await prisma.usuario.findMany({
    where: busca
      ? {
          OR: [
            { nome: { contains: busca, mode: "insensitive" as const } },
            { email: { contains: busca, mode: "insensitive" as const } },
          ],
        }
      : {},
    orderBy: { dataCadastro: "desc" },
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      dataCadastro: true,
      _count: { select: { descartes: true, itens: true, favoritos: true, pontosCriados: true } },
    },
  });

  const somas = await prisma.descarte.groupBy({ by: ["usuarioId"], _sum: { pontos: true } });
  const pontosPorUsuario = new Map(somas.map((s) => [s.usuarioId, s._sum.pontos ?? 0]));

  return usuarios.map(({ _count, ...u }) => ({
    ...u,
    descartes: _count.descartes,
    materiais: _count.itens,
    favoritos: _count.favoritos,
    pontosSugeridos: _count.pontosCriados,
    ecopontos: pontosPorUsuario.get(u.id) ?? 0,
  }));
}

export async function alterarPapel(id: string, papel: unknown, idDeQuemPede: string) {
  if (papel !== "ADMIN" && papel !== "USUARIO") throw erro(400, "Papel inválido.");
  if (id === idDeQuemPede && papel === "USUARIO") {
    throw erro(400, "Você não pode remover o seu próprio acesso de administrador.");
  }

  const usuario = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
  if (!usuario) throw erro(404, "Usuário não encontrado.");

  return prisma.usuario.update({
    where: { id },
    data: { papel: papel as Papel },
    select: { id: true, nome: true, papel: true },
  });
}

export async function removerUsuario(id: string, idDeQuemPede: string) {
  if (id === idDeQuemPede) throw erro(400, "Você não pode excluir a sua própria conta por aqui.");

  const usuario = await prisma.usuario.findUnique({ where: { id }, select: { id: true, nome: true } });
  if (!usuario) throw erro(404, "Usuário não encontrado.");

  await prisma.usuario.delete({ where: { id } });
  return { nome: usuario.nome };
}

// ------------------------------------------------------------------ catálogo e descartes

export async function listarItensAdmin({ q, categoria }: { q?: string | null; categoria?: string | null } = {}) {
  const busca = q?.trim();

  const itens = await prisma.item.findMany({
    where: {
      ...(ehCategoria(categoria) ? { categoria } : {}),
      ...(busca ? { nomeItem: { contains: busca, mode: "insensitive" as const } } : {}),
    },
    orderBy: { dataPublicacao: "desc" },
    select: {
      id: true,
      nomeItem: true,
      descricao: true,
      categoria: true,
      dataPublicacao: true,
      usuario: { select: { id: true, nome: true, email: true } },
      _count: { select: { favoritos: true, fotos: true } },
    },
  });

  return itens.map(({ _count, ...i }) => ({ ...i, favoritos: _count.favoritos, fotos: _count.fotos }));
}

export async function listarDescartesAdmin({ limite = 40, categoria }: { limite?: number; categoria?: string | null } = {}) {
  const descartes = await prisma.descarte.findMany({
    where: ehCategoria(categoria) ? { categoria: categoria as CategoriaKey } : {},
    orderBy: { data: "desc" },
    take: Math.min(Math.max(limite, 1), 200),
    select: {
      id: true,
      categoria: true,
      quantidade: true,
      pontos: true,
      data: true,
      usuario: { select: { id: true, nome: true, email: true } },
      ponto: { select: { id: true, nome: true, bairro: true } },
    },
  });
  return descartes;
}

export async function removerDescarte(id: string) {
  const descarte = await prisma.descarte.findUnique({ where: { id }, select: { id: true, pontos: true } });
  if (!descarte) throw erro(404, "Descarte não encontrado.");

  await prisma.descarte.delete({ where: { id } });
  return { pontosRemovidos: descarte.pontos };
}
