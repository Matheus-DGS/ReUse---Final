import { NextResponse } from "next/server";
import { COOKIE_SESSAO, opcoesCookieExpirado } from "@/lib/sessao";

// POST /api/auth/logout — a API é stateless, então encerrar a sessão é apagar o cookie.
export async function POST() {
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_SESSAO, "", opcoesCookieExpirado);
  return resposta;
}
