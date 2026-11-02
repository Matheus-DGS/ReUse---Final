"use client";

import "leaflet/dist/leaflet.css";
import "./mapa.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import CamadaMapa from "./CamadaMapa";
import { CENTRO_PADRAO } from "@/lib/pontos";

type SeletorLocalizacaoProps = {
  posicao: [number, number] | null;
  onEscolher: (posicao: [number, number]) => void;
};

const icone = L.divIcon({
  className: "",
  html: '<div class="pino-reuse selecionado" style="--anel:var(--acento)"><span>+</span></div>',
  iconSize: [34, 41],
  iconAnchor: [17, 41],
});

function CapturarClique({ onEscolher, posicao }: SeletorLocalizacaoProps) {
  const map = useMap();
  useMapEvents({
    click: (e) => onEscolher([Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))]),
  });

  useEffect(() => {
    if (posicao) map.flyTo(posicao, Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [posicao, map]);

  return null;
}

export default function SeletorLocalizacao({ posicao, onEscolher }: SeletorLocalizacaoProps) {
  return (
    <MapContainer center={posicao ?? CENTRO_PADRAO} zoom={posicao ? 16 : 13} className="mapa-reuse" style={{ cursor: "crosshair" }}>
      <CamadaMapa />
      <CapturarClique posicao={posicao} onEscolher={onEscolher} />
      {posicao && (
        <Marker
          position={posicao}
          icon={icone}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = (e.target as L.Marker).getLatLng();
              onEscolher([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
