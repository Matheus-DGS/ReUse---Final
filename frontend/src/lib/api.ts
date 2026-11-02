// Cliente HTTP do backend ReUse! (Node.js + Express + Prisma).
//
// Este é o ÚNICO ponto do frontend que fala com a API. Server Components, Server Actions e os
// Route Handlers de proxy passam por aqui. O token da sessão sai do cookie httpOnly e vai no
// header `Authorization: Bearer`, então ele nunca chega ao JavaScript do navegador.

import { cookies } from "next/headers";
import { COOKIE_SESSAO } from "./sessao";

/** URL do backend. Em produção, aponta para o deploy do Render. */
export const URL_API = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
  /\/+$/,
  ""
);

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    mensagem: string
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

type Opcoes = {
  metodo?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  corpo?: unknown;
  /** Envia o token da sessão (padrão: sim). */
  autenticado?: boolean;
  /** Cabeçalhos extras repassados ao backend. */
  cabecalhos?: Record<string, string>;
};

export async function tokenDaSessao() {
  return (await cookies()).get(COOKIE_SESSAO)?.value;
}

export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = "GET", corpo, autenticado = true, cabecalhos = {} } = opcoes;
  const token = autenticado ? await tokenDaSessao() : undefined;

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: metodo,
      headers: {
        Accept: "application/json",
        ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...cabecalhos,
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      // Os dados de descartes, ranking e EcoPontos mudam a cada interação: nada de cache
      cache: "no-store",
    });
  } catch {
    throw new ErroApi(503, "Não foi possível falar com o servidor do ReUse!. Tente novamente em alguns instantes.");
  }

  if (resposta.status === 204) return undefined as T;

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const mensagem =
      (dados as { erro?: string } | null)?.erro ?? `Falha na requisição (${resposta.status}).`;
    throw new ErroApi(resposta.status, mensagem);
  }

  return dados as T;
}

/** Consulta pública, sem enviar o token (cabeçalhos menores em páginas abertas). */
export const apiPublica = <T>(caminho: string) => api<T>(caminho, { autenticado: false });

/** `null` em vez de exceção quando o recurso não existe — usado com `notFound()`. */
export async function apiOuNulo<T>(caminho: string, opcoes: Opcoes = {}): Promise<T | null> {
  try {
    return await api<T>(caminho, opcoes);
  } catch (e) {
    if (e instanceof ErroApi && e.status === 404) return null;
    throw e;
  }
}
