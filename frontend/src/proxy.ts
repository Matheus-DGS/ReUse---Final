import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO } from "@/lib/sessao";

// Proxy (antigo middleware) do Next.js: barra o acesso a rotas privadas antes mesmo de
// renderizar a página, redirecionando para o login com o destino original.
//
// Aqui só verificamos se existe o cookie de sessão — quem valida a assinatura do token é o
// backend, em toda chamada da API. As páginas protegidas confirmam a sessão com `exigirUsuario`,
// então um cookie vencido nunca libera conteúdo, apenas custa um redirecionamento a mais.
export function proxy(request: NextRequest) {
  if (request.cookies.get(COOKIE_SESSAO)?.value) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?redirecionar=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/perfil", "/favoritos", "/pontos/novo", "/materiais/novo", "/admin", "/admin/:caminho*"],
};
