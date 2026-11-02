// Utilitários compartilhados pelas rotas: erros com status HTTP e wrapper de handler assíncrono.

import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Erro de negócio que o tratador global transforma em `{ erro }` com o status informado. */
export class ErroHttp extends Error {
  constructor(
    readonly status: number,
    mensagem: string
  ) {
    super(mensagem);
  }
}

export const erro = (status: number, mensagem: string) => new ErroHttp(status, mensagem);

/**
 * Encaminha rejeições de handlers `async` para o tratador de erros do Express 4,
 * que não captura promises por conta própria.
 */
export function rota(handler: (req: Request, res: Response) => Promise<unknown> | unknown): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}

export function tratadorDeErros(e: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (e instanceof ErroHttp) {
    res.status(e.status).json({ erro: e.message });
    return;
  }
  console.error("[api] erro não tratado:", e);
  res.status(500).json({ erro: "Erro interno no servidor. Tente novamente em alguns instantes." });
}

/** Lê um texto obrigatório do corpo da requisição. */
export function texto(valor: unknown, campo: string, { minimo = 1, maximo = 600 } = {}) {
  const limpo = String(valor ?? "").trim();
  if (limpo.length < minimo) throw erro(400, `Informe ${campo}.`);
  return limpo.slice(0, maximo);
}
