import { cache } from "react";
import { redirect } from "next/navigation";
import { api, ErroApi } from "./api";
import type { ResumoSessao, Usuario } from "./tipos";

type RespostaSessao = { usuario: Usuario | null; resumo: ResumoSessao | null };

/**
 * Lê a sessão atual chamando `GET /api/auth/me` no backend com o token do cookie.
 * `cache` garante uma única chamada por requisição, mesmo que o Header e a página peçam o usuário.
 */
export const sessaoAtual = cache(async (): Promise<RespostaSessao> => {
  try {
    return await api<RespostaSessao>("/api/auth/me");
  } catch (e) {
    // Token expirado/inválido ou API fora do ar: a navegação pública continua funcionando
    if (e instanceof ErroApi) return { usuario: null, resumo: null };
    throw e;
  }
});

export async function usuarioAtual() {
  return (await sessaoAtual()).usuario;
}

/** Igual a usuarioAtual, mas redireciona para o login quando não há sessão. */
export async function exigirUsuario(destino: string) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect(`/login?redirecionar=${encodeURIComponent(destino)}`);
  return usuario;
}

/** Protege a área administrativa: sem sessão vai para o login, sem papel ADMIN vai para a home. */
export async function exigirAdmin(destino: string) {
  const usuario = await exigirUsuario(destino);
  if (usuario.papel !== "ADMIN") redirect("/");
  return usuario;
}

/** "Ana Souza" -> "Ana S." — usado em rankings e atividades públicas. */
export function nomePublico(nome: string) {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1][0]}.`;
}
