export const TIPOS_PONTO = {
  ECOPONTO: {
    label: "Ecoponto",
    descricao: "Área pública para entrega de volumes maiores e materiais variados.",
  },
  PEV: {
    label: "PEV",
    descricao: "Ponto de Entrega Voluntária: contêineres de coleta seletiva em locais de passagem.",
  },
  COOPERATIVA: {
    label: "Cooperativa",
    descricao: "Cooperativa de catadores que tria e comercializa os recicláveis.",
  },
  PARCEIRO: {
    label: "Parceiro",
    descricao: "Estabelecimento parceiro que recebe materiais específicos, como eletrônicos.",
  },
} as const;

export type TipoPontoKey = keyof typeof TIPOS_PONTO;

export function ehTipoPonto(valor: unknown): valor is TipoPontoKey {
  return typeof valor === "string" && valor in TIPOS_PONTO;
}

/** Link de rota no Google Maps a partir das coordenadas do ponto. */
export function linkRota(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

// Centro padrão do mapa: FIAP Paulista, São Paulo
export const CENTRO_PADRAO: [number, number] = [-23.5641, -46.6524];
