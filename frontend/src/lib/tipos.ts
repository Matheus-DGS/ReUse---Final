// Formato dos dados devolvidos pela API do ReUse!.
//
// O frontend não importa mais o Prisma Client: ele conversa com o backend por HTTP, então os
// tipos ficam declarados aqui. Campos de data chegam como string ISO (JSON não tem Date).

import type { CategoriaKey } from "./categorias";
import type { EstatisticasUsuario } from "./gamificacao";
import type { TipoPontoKey } from "./pontos";

export type Papel = "USUARIO" | "ADMIN";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  dataCadastro: string;
};

export type ResumoSessao = {
  totalPontos: number;
  nivel: string;
  numeroNivel: number;
};

export type Foto = { id?: string; urlFoto: string; principal: boolean };

export type Item = {
  id: string;
  nomeItem: string;
  descricao: string;
  categoria: CategoriaKey;
  dataPublicacao: string;
  usuarioId: string;
  fotos: Foto[];
};

export type ItemDetalhe = Item & { usuario: { nome: string } };

export type Ponto = {
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
  dataCadastro: string;
  totalDescartes: number;
  distanciaKm: number | null;
};

export type PontoDetalhe = Omit<Ponto, "distanciaKm"> & {
  volumes: number;
  criadoPor: { id: string; nome: string } | null;
  atividade: { id: string; categoria: CategoriaKey; quantidade: number; data: string; autor: string }[];
};

export type Nivel = {
  numero: number;
  nome: string;
  simbolo: string;
  proximo: { nome: string; minimo: number; simbolo: string } | null;
  faltam: number;
  progresso: number;
};

export type Impacto = {
  estatisticas: EstatisticasUsuario;
  porCategoria: Record<CategoriaKey, number>;
  volumesTotais: number;
  nivel: Nivel;
};

/** Resposta de `POST /api/descartes`: o que o usuário ganhou com o registro. */
export type DescarteRegistrado = {
  status: "sucesso";
  id: string;
  pontoId: string;
  categoria: CategoriaKey;
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

export type LinhaRanking = {
  posicao: number;
  usuarioId: string;
  nome: string;
  pontos: number;
  descartes: number;
};

export type DescarteHistorico = {
  id: string;
  categoria: CategoriaKey;
  quantidade: number;
  pontos: number;
  data: string;
  ponto: { id: string; nome: string; bairro: string };
};

// ------------------------------------------------------------------ respostas por tela (BFF)

export type PaginaInicio = {
  itensRecentes: Item[];
  pontos: Ponto[];
  top3: LinhaRanking[];
  totais: { itens: number; pontos: number; descartes: number; usuarios: number };
  missaoCumprida: boolean;
};

export type PaginaPontos = {
  pontos: Ponto[];
  totalDescartes: number;
  sugeridos: number;
  missaoCumprida: boolean;
};

export type PaginaPonto = { ponto: PontoDetalhe; descartesHoje: number };

export type PaginaMateriais = { itens: Item[]; total: number };

export type PaginaMaterial = {
  item: ItemDetalhe;
  favoritado: boolean;
  pontosQueAceitam: { id: string; nome: string; bairro: string; tipo: TipoPontoKey; horario: string }[];
  totalPontos: number;
};

export type PaginaPerfil = Impacto & {
  historico: DescarteHistorico[];
  posicao: number | null;
  missaoCumprida: boolean;
};

export type PaginaFavoritos = {
  favoritos: {
    id: string;
    dataFavorito: string;
    item: { id: string; nomeItem: string; descricao: string; categoria: CategoriaKey; fotos: Foto[] };
  }[];
};

// ------------------------------------------------------------------ área administrativa

export type PontoAdmin = Omit<Ponto, "distanciaKm"> & {
  criadoPor: { id: string; nome: string; email: string } | null;
};

export type UsuarioAdmin = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  dataCadastro: string;
  descartes: number;
  materiais: number;
  favoritos: number;
  pontosSugeridos: number;
  ecopontos: number;
};

export type ItemAdmin = {
  id: string;
  nomeItem: string;
  descricao: string;
  categoria: CategoriaKey;
  dataPublicacao: string;
  usuario: { id: string; nome: string; email: string };
  favoritos: number;
  fotos: number;
};

export type DescarteAdmin = {
  id: string;
  categoria: CategoriaKey;
  quantidade: number;
  pontos: number;
  data: string;
  usuario: { id: string; nome: string; email: string };
  ponto: { id: string; nome: string; bairro: string };
};

export type PainelAdmin = {
  totais: {
    usuarios: number;
    admins: number;
    pontos: number;
    verificados: number;
    pendentes: number;
    materiais: number;
    descartes: number;
    descartesHoje: number;
    descartesMes: number;
    ecopontosDistribuidos: number;
    volumesDestinados: number;
  };
  categorias: { categoria: CategoriaKey; descartes: number; volumes: number; pontos: number }[];
  tipos: { tipo: TipoPontoKey; total: number }[];
  serie: { dia: string; descartes: number; volumes: number }[];
  pendentes: {
    id: string;
    nome: string;
    tipo: TipoPontoKey;
    bairro: string;
    cidade: string;
    materiais: CategoriaKey[];
    dataCadastro: string;
    criadoPor: { id: string; nome: string; email: string } | null;
  }[];
  topPontos: {
    id: string;
    nome: string;
    bairro: string;
    tipo: TipoPontoKey;
    verificado: boolean;
    totalDescartes: number;
  }[];
  ultimosUsuarios: { id: string; nome: string; email: string; papel: Papel; dataCadastro: string }[];
};
