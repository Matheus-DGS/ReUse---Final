// Contrato comum aos dois motores de conversa: o IBM Watson (principal) e o motor local (fallback).
// Ambos devolvem a saída no formato "generic" da API v2 do Watson.

export type GenericTexto = { response_type: "text"; text: string };
export type GenericOpcoes = {
  response_type: "option";
  title?: string;
  options: { label: string; value: { input: { text: string } } }[];
};
export type GenericAcao = { response_type: "user_defined"; user_defined: Record<string, unknown> };
export type Generic = GenericTexto | GenericOpcoes | GenericAcao | { response_type: string; [k: string]: unknown };

export type SaidaMotor = {
  generic: Generic[];
  contexto: unknown;
  intencao: { nome: string; confianca: number } | null;
  motor: "watson" | "local";
};
