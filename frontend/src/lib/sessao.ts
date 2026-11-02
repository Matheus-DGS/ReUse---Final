// Cookie de sessão do frontend.
//
// Quem valida e assina o token é o backend. Aqui ele só é guardado em um cookie httpOnly,
// que o Next.js lê no servidor para montar o header Authorization das chamadas à API.

export const COOKIE_SESSAO = "reuse_session";
export const DURACAO_SESSAO = 60 * 60 * 24 * 7; // 7 dias

export const opcoesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DURACAO_SESSAO,
};

export const opcoesCookieExpirado = { path: "/", maxAge: 0 };
