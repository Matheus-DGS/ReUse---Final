/** Aceita apenas caminhos internos no parâmetro ?redirecionar= (evita open redirect). */
export function destinoSeguro(destino: string | null) {
  return destino && destino.startsWith("/") && !destino.startsWith("//") ? destino : "/";
}
