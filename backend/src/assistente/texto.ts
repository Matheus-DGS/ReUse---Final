// Utilitários de texto em português usados pelo NLU local e pela resolução de pontos/itens.

const STOPWORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das", "no", "na", "nos", "nas",
  "em", "para", "pra", "pro", "por", "e", "ou", "eu", "me", "mim", "meu", "minha", "meus", "minhas", "que",
  "se", "com", "ao", "aos", "ja", "la", "ai", "isso", "esse", "essa", "este", "esta", "voce", "vc", "ele",
  "ela", "quero", "queria", "gostaria", "favor", "poderia", "pode", "consigo", "agora", "hoje", "ta", "tá",
]);

/** Minúsculas, sem acentos e sem pontuação. */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove plural simples: "latas" → "lata", "coes" → "cao". */
export function singular(palavra: string) {
  if (palavra.length <= 3) return palavra;
  if (palavra.endsWith("oes")) return palavra.slice(0, -3) + "ao";
  if (palavra.endsWith("aes")) return palavra.slice(0, -3) + "ao";
  if (palavra.endsWith("s") && !palavra.endsWith("ss")) return palavra.slice(0, -1);
  return palavra;
}

export function palavras(texto: string) {
  return normalizar(texto).split(" ").filter(Boolean).map(singular);
}

const TERMINACOES = ["aria", "arei", "ando", "endo", "ado", "ada", "ar", "er", "ir", "ei", "ou", "am", "em", "a", "e", "o"];

/** Radical aproximado: agrupa conjugações ("tira"/"tirar"/"tire", "registrei"/"registro"). */
export function radical(palavra: string) {
  if (/^\d+$/.test(palavra)) return palavra;
  let base = palavra;
  for (const t of TERMINACOES) {
    if (base.endsWith(t) && base.length - t.length >= 3) {
      base = base.slice(0, -t.length);
      break;
    }
  }
  return base.length > 6 ? base.slice(0, 6) : base;
}

export function termosRelevantes(texto: string) {
  return palavras(texto)
    .filter((p) => !STOPWORDS.has(p))
    .map(radical);
}

/** Verifica se a sequência de palavras `trecho` aparece em `texto` (insensível a acento e plural). */
export function contemTrecho(texto: string, trecho: string) {
  const alvo = palavras(texto);
  const busca = palavras(trecho);
  if (busca.length === 0) return -1;
  for (let i = 0; i + busca.length <= alvo.length; i++) {
    if (busca.every((p, j) => alvo[i + j] === p)) return i;
  }
  return -1;
}
