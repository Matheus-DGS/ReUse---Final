// Autenticação por token Bearer.
//
// `identificar` roda em todas as rotas e apenas anexa `req.usuario` quando há um token válido —
// rotas públicas (mapa, catálogo, ranking, assistente) continuam funcionando sem login.
// `exigirLogin` e `exigirAdmin` barram o acesso quando o recurso é privado.

import type { NextFunction, Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { lerSessao } from "@/lib/sessao";
import { erro } from "@/lib/http";

export type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  papel: "USUARIO" | "ADMIN";
  dataCadastro: Date;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

function tokenDoHeader(req: Request) {
  const header = req.headers.authorization;
  if (!header) return undefined;
  const [esquema, valor] = header.split(" ");
  return esquema?.toLowerCase() === "bearer" ? valor : undefined;
}

export async function identificar(req: Request, _res: Response, next: NextFunction) {
  try {
    const sessao = await lerSessao(tokenDoHeader(req));
    if (sessao) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: sessao.userId },
        select: { id: true, nome: true, email: true, papel: true, dataCadastro: true },
      });
      if (usuario) req.usuario = usuario;
    }
    next();
  } catch (e) {
    next(e);
  }
}

export function exigirLogin(req: Request, _res: Response, next: NextFunction) {
  if (!req.usuario) return next(erro(401, "É necessário estar autenticado."));
  next();
}

export function exigirAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.usuario) return next(erro(401, "É necessário estar autenticado."));
  if (req.usuario.papel !== "ADMIN") return next(erro(403, "Esta área é restrita à administração do ReUse!."));
  next();
}

/** Usuário autenticado garantido — usar somente depois de `exigirLogin`/`exigirAdmin`. */
export const usuarioDe = (req: Request) => req.usuario!;
