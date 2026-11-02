import type { Ponto } from "@/lib/tipos";

/**
 * Formato serializável de um ponto de coleta enviado aos Client Components —
 * é exatamente o que a API devolve em `GET /api/pontos`.
 */
export type PontoResumo = Ponto;
