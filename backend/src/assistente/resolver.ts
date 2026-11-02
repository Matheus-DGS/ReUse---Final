// Encontra no banco o ponto de coleta ou o material que o usuário citou em texto livre
// ("no ecoponto da vila mariana", "a garrafa pet"). Funciona inclusive para pontos e itens
// cadastrados depois da skill do Watson ter sido treinada.

import { palavras } from "./texto";

const GENERICAS = new Set([
  "ecoponto", "pev", "cooperativa", "coleta", "ponto", "parque", "museu", "estacao", "aberta", "comunitaria",
  "compostagem", "condominio", "feira", "mercado", "de", "do", "da", "dos", "das", "e", "o", "a", "em", "no", "na",
]);

function nucleo(nome: string) {
  // "TecVerde — Coleta de Eletrônicos" → "TecVerde"
  const principal = nome.split(/\s[—-]\s/)[0];
  const distintivas = palavras(principal).filter((p) => !GENERICAS.has(p));
  return distintivas.length ? distintivas : palavras(principal);
}

function pontuar(texto: string, alvo: { nome: string; extras?: string[] }) {
  const entrada = new Set(palavras(texto));
  const chaves = [nucleo(alvo.nome), ...(alvo.extras ?? []).map((e) => palavras(e))];
  let melhor = 0;
  for (const chave of chaves) {
    if (chave.length === 0) continue;
    const presentes = chave.filter((p) => entrada.has(p)).length;
    melhor = Math.max(melhor, presentes / chave.length);
  }
  return melhor;
}

export function resolverPorNome<T extends { nome: string; extras?: string[] }>(texto: string, candidatos: T[]) {
  const pontuados = candidatos
    .map((c) => ({ item: c, nota: pontuar(texto, c) }))
    .filter((c) => c.nota >= 0.5)
    .sort((a, b) => b.nota - a.nota);

  if (pontuados.length === 0) return { tipo: "nenhum" as const };
  const [primeiro, segundo] = pontuados;
  if (!segundo || primeiro.nota - segundo.nota >= 0.25) return { tipo: "unico" as const, item: primeiro.item };
  return { tipo: "varios" as const, itens: pontuados.filter((p) => p.nota === primeiro.nota).map((p) => p.item) };
}
