// Proxy da API: tudo em /api/* que não tenha um handler próprio é repassado ao backend.
//
// Por que existe:
//  1. O token da sessão fica em um cookie httpOnly. Como a chamada sai do servidor do Next.js,
//     o navegador nunca precisa ver o token para falar com a API.
//  2. O frontend expõe os mesmos caminhos do backend (/api/pontos, /api/items, /api/assistente...),
//     então os Client Components e os links públicos continuam idênticos às fases anteriores.
//
// As rotas /api/auth/login, /api/auth/register e /api/auth/logout têm handlers próprios — o
// App Router dá preferência a eles sobre este catch-all.

import { NextRequest, NextResponse } from "next/server";
import { URL_API, tokenDaSessao } from "@/lib/api";

const METODOS_COM_CORPO = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function repassar(req: NextRequest, caminho: string[]) {
  const destino = `${URL_API}/api/${caminho.join("/")}${req.nextUrl.search}`;
  const token = await tokenDaSessao();
  const corpo = METODOS_COM_CORPO.has(req.method) ? await req.text() : undefined;

  let resposta: Response;
  try {
    resposta = await fetch(destino, {
      method: req.method,
      headers: {
        Accept: "application/json",
        ...(corpo ? { "Content-Type": req.headers.get("content-type") ?? "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo || undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível falar com o servidor do ReUse!. Tente novamente em alguns instantes." },
      { status: 503 }
    );
  }

  const texto = await resposta.text();
  return new NextResponse(texto, {
    status: resposta.status,
    headers: { "Content-Type": resposta.headers.get("content-type") ?? "application/json" },
  });
}

type Contexto = { params: Promise<{ caminho: string[] }> };

const handler = async (req: NextRequest, { params }: Contexto) => repassar(req, (await params).caminho);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
