// Emissão e verificação do token de sessão (JWT assinado com HS256).
//
// O backend é stateless: ele não guarda cookie nenhum. Quem faz login recebe um token
// e o envia de volta no header `Authorization: Bearer <token>`. O frontend Next.js guarda
// esse token em um cookie httpOnly, então ele nunca fica exposto ao JavaScript do navegador.

import { SignJWT, jwtVerify } from "jose";

export const DURACAO_SESSAO = 60 * 60 * 24 * 7; // 7 dias, em segundos

export type SessionPayload = { userId: string };

function chave() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-nao-use-em-producao");
}

export async function assinarSessao(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO}s`)
    .sign(chave());
}

export async function lerSessao(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave());
    return typeof payload.userId === "string" ? { userId: payload.userId } : null;
  } catch {
    return null;
  }
}
