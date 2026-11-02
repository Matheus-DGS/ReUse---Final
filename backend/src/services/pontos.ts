// Consultas e regras dos pontos de coleta (área "Descarte Consciente").

import { prisma } from "@/lib/prisma";
import { erro } from "@/lib/http";
import { ehCategoria, type CategoriaKey } from "@/dominio/categorias";
import { ehTipoPonto, type TipoPontoKey } from "@/dominio/pontos";
import { distanciaKm } from "@/dominio/geo";
import { nomePublico } from "@/dominio/nomes";

export type FiltrosPonto = {
  material?: string | null;
  tipo?: string | null;
  lat?: number;
  lng?: number;
};

/** Ponto no formato enviado ao frontend e à API pública (sem expor quem o sugeriu). */
export type PontoListado = {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoPontoKey;
  endereco: string;
  bairro: string;
  cidade: string;
  latitude: number;
  longitude: number;
  horario: string;
  telefone: string | null;
  materiais: CategoriaKey[];
  verificado: boolean;
  dataCadastro: Date;
  totalDescartes: number;
  distanciaKm: number | null;
};

export async function listarPontos(filtros: FiltrosPonto = {}): Promise<PontoListado[]> {
  const { material, tipo, lat, lng } = filtros;
  const temLocalizacao = Number.isFinite(lat) && Number.isFinite(lng);

  const pontos = await prisma.pontoColeta.findMany({
    where: {
      ...(ehCategoria(material) ? { materiais: { has: material } } : {}),
      ...(ehTipoPonto(tipo) ? { tipo } : {}),
    },
    orderBy: { nome: "asc" },
    omit: { criadoPorId: true },
    include: { _count: { select: { descartes: true } } },
  });

  const resultado = pontos.map(({ _count, ...p }) => ({
    ...p,
    totalDescartes: _count.descartes,
    distanciaKm: temLocalizacao
      ? Number(distanciaKm({ latitude: lat as number, longitude: lng as number }, p).toFixed(2))
      : null,
  }));

  if (temLocalizacao) resultado.sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0));
  return resultado;
}

/** Detalhe do ponto: dados, atividade recente da comunidade e volumes recebidos. */
export async function pontoPorId(id: string) {
  const ponto = await prisma.pontoColeta.findUnique({
    where: { id },
    omit: { criadoPorId: true },
    include: {
      criadoPor: { select: { id: true, nome: true } },
      descartes: {
        orderBy: { data: "desc" },
        take: 6,
        include: { usuario: { select: { nome: true } } },
      },
      _count: { select: { descartes: true } },
    },
  });
  if (!ponto) throw erro(404, "Ponto de coleta não encontrado.");

  const volumes = await prisma.descarte.aggregate({
    where: { pontoId: ponto.id },
    _sum: { quantidade: true },
  });

  const { _count, descartes, criadoPor, ...dados } = ponto;
  return {
    ...dados,
    totalDescartes: _count.descartes,
    volumes: volumes._sum.quantidade ?? 0,
    // Só o id de quem sugeriu sai daqui: o nome vai abreviado, como no resto da plataforma
    criadoPor: criadoPor ? { id: criadoPor.id, nome: nomePublico(criadoPor.nome) } : null,
    atividade: descartes.map((d) => ({
      id: d.id,
      categoria: d.categoria,
      quantidade: d.quantidade,
      data: d.data,
      autor: nomePublico(d.usuario.nome),
    })),
  };
}

export type DadosNovoPonto = {
  nome: string;
  tipo: string;
  descricao?: string;
  endereco: string;
  bairro: string;
  cidade?: string;
  horario: string;
  telefone?: string;
  latitude: unknown;
  longitude: unknown;
  materiais: unknown[];
};

export async function criarPonto(usuarioId: string, dados: DadosNovoPonto) {
  const nome = String(dados.nome ?? "").trim();
  const materiais = (dados.materiais ?? []).filter(ehCategoria);

  if (nome.length < 3) throw erro(400, "Dê um nome ao ponto (mínimo de 3 caracteres).");
  if (!ehTipoPonto(dados.tipo)) throw erro(400, "Escolha o tipo do ponto.");
  if (!String(dados.endereco ?? "").trim() || !String(dados.bairro ?? "").trim()) {
    throw erro(400, "Informe endereço e bairro.");
  }
  if (!String(dados.horario ?? "").trim()) throw erro(400, "Informe o horário de funcionamento.");
  if (materiais.length === 0) throw erro(400, "Marque ao menos um material aceito.");

  const latitude = Number(dados.latitude);
  const longitude = Number(dados.longitude);
  const coordenadasValidas =
    Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  if (!coordenadasValidas) throw erro(400, "Marque a localização do ponto clicando no mapa.");

  return prisma.pontoColeta.create({
    data: {
      nome,
      tipo: dados.tipo,
      descricao: String(dados.descricao ?? "").trim() || "Ponto sugerido pela comunidade ReUse!.",
      endereco: String(dados.endereco).trim(),
      bairro: String(dados.bairro).trim(),
      cidade: String(dados.cidade ?? "").trim() || "São Paulo",
      horario: String(dados.horario).trim(),
      telefone: String(dados.telefone ?? "").trim() || null,
      latitude,
      longitude,
      materiais,
      // Pontos da comunidade entram sem o selo de verificado: a área administrativa os aprova
      verificado: false,
      criadoPorId: usuarioId,
    },
    select: { id: true, nome: true },
  });
}
