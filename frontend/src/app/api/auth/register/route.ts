import { NextRequest, NextResponse } from "next/server";
import { api, ErroApi } from "@/lib/api";
import { COOKIE_SESSAO, opcoesCookie } from "@/lib/sessao";
import type { Usuario } from "@/lib/tipos";

type RespostaCadastro = { token: string; usuario: Usuario };

// POST /api/auth/register — cria a conta no backend e já abre a sessão.
export async function POST(req: NextRequest) {
  const { nome, email, senha } = await req.json().catch(() => ({}));

  try {
    const { token, usuario } = await api<RespostaCadastro>("/api/auth/register", {
      metodo: "POST",
      corpo: { nome, email, senha },
      autenticado: false,
    });

    const resposta = NextResponse.json({ usuario }, { status: 201 });
    resposta.cookies.set(COOKIE_SESSAO, token, opcoesCookie);
    return resposta;
  } catch (e) {
    const erro = e instanceof ErroApi ? e : new ErroApi(500, "Não foi possível criar sua conta agora.");
    return NextResponse.json({ erro: erro.message }, { status: erro.status });
  }
}
