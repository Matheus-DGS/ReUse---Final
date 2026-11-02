"use client";

import { TileLayer } from "react-leaflet";

// Tiles oficiais do OpenStreetMap: gratuitos, sem chave de API, exigem apenas atribuição.
// A dessaturação aplicada em mapa.css faz os pinos coloridos se destacarem.
export default function CamadaMapa() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
    />
  );
}
