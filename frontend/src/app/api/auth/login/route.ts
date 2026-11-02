import { NextRequest, NextResponse } from "next/server";
import { api, ErroApi } from "@/lib/api";
import { COOKIE_SESSAO, opcoesCookie } from "@/lib/sessao";
import type { Usuario } from "@/lib/tipos";

type RespostaLogin = { token: string; usuario: Usuario };

// POST /api/auth/login — autentica no backend e guarda o token em um cookie httpOnly.
// O token nunca vai para o JavaScript do navegador: o formulário só recebe o usuário.
export async function POST(req: NextRequest) {
  const { email, senha } = await req.json().catch(() => ({}));

  try {
    const { token, usuario } = await api<RespostaLogin>("/api/auth/login", {
      metodo: "POST",
      corpo: { email, senha },
      autenticado: false,
    });

    const resposta = NextResponse.json({ usuario });
    resposta.cookies.set(COOKIE_SESSAO, token, opcoesCookie);
    return resposta;
  } catch (e) {
    const erro = e instanceof ErroApi ? e : new ErroApi(500, "Não foi possível entrar agora.");
    return NextResponse.json({ erro: erro.message }, { status: erro.status });
  }
}
