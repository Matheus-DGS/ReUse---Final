/** "Ana Souza" -> "Ana S." — usado em rankings e atividades públicas. */
export function nomePublico(nome: string) {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1][0]}.`;
}
