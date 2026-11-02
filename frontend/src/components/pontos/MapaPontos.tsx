"use client";

import "leaflet/dist/leaflet.css";
import "./mapa.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import CamadaMapa from "./CamadaMapa";
import { CATEGORIAS } from "@/lib/categorias";
import { CENTRO_PADRAO } from "@/lib/pontos";
import type { PontoResumo } from "./tipos";

export type MapaPontosProps = {
  pontos: PontoResumo[];
  selecionadoId?: string | null;
  onSelecionar?: (id: string) => void;
  localizacao?: { latitude: number; longitude: number } | null;
  zoomInicial?: number;
  interativo?: boolean;
  mostrarPopup?: boolean;
  /** Zoom pela roda do mouse — desligado em minimapas para não "prender" a rolagem da página */
  zoomComRoda?: boolean;
};

/** Gera o gradiente cônico com as cores de cada material aceito. */
function anelDeCores(materiais: PontoResumo["materiais"]) {
  if (materiais.length === 0) return "var(--linha)";
  const fatia = 360 / materiais.length;
  const partes = materiais.map((m, i) => `${CATEGORIAS[m].cor} ${i * fatia}deg ${(i + 1) * fatia}deg`);
  return `conic-gradient(${partes.join(", ")})`;
}

function iconePonto(ponto: PontoResumo, selecionado: boolean) {
  const classes = ["pino-reuse", selecionado ? "selecionado" : "", ponto.verificado ? "" : "comunidade"];
  return L.divIcon({
    className: "",
    html: `<div class="${classes.join(" ")}" style="--anel:${anelDeCores(ponto.materiais)}"><span>${ponto.materiais.length}</span></div>`,
    iconSize: [34, 41],
    iconAnchor: [17, 41],
    popupAnchor: [0, -38],
  });
}

const iconeUsuario = L.divIcon({
  className: "",
  html: '<div class="voce-esta-aqui"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Mantém a câmera do mapa sincronizada com filtros, seleção e localização. */
function ControleCamera({
  pontos,
  selecionadoId,
  localizacao,
}: Pick<MapaPontosProps, "pontos" | "selecionadoId" | "localizacao">) {
  const map = useMap();
  const chavePontos = pontos.map((p) => p.id).join("|");
  const [versaoTamanho, setVersaoTamanho] = useState(0);
  const ultimaVersaoTamanho = useRef(0);

  // O container muda de tamanho enquanto a página se monta (e pode nascer oculto na alternância
  // Lista/Mapa do celular): o Leaflet precisa recalcular as dimensões e reenquadrar os pontos.
  useEffect(() => {
    const container = map.getContainer();
    let tamanhoAnterior = `${container.clientWidth}x${container.clientHeight}`;
    let espera: ReturnType<typeof setTimeout>;
    const observador = new ResizeObserver(() => {
      const tamanho = `${container.clientWidth}x${container.clientHeight}`;
      if (tamanho === tamanhoAnterior) return;
      tamanhoAnterior = tamanho;
      clearTimeout(espera);
      espera = setTimeout(() => {
        map.invalidateSize();
        setVersaoTamanho((v) => v + 1);
      }, 80);
    });
    observador.observe(container);
    return () => {
      clearTimeout(espera);
      observador.disconnect();
    };
  }, [map]);

  useEffect(() => {
    // Mudou só o tamanho (e não os filtros)? Respeita o ponto que o usuário selecionou.
    const soRedimensionou = ultimaVersaoTamanho.current !== versaoTamanho;
    ultimaVersaoTamanho.current = versaoTamanho;
    if (localizacao || (soRedimensionou && selecionadoId) || pontos.length === 0) return;
    if (pontos.length === 1) {
      map.setView([pontos[0].latitude, pontos[0].longitude], 15);
      return;
    }
    const limites = L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(limites, { padding: [40, 40], maxZoom: 15 });
  }, [chavePontos, versaoTamanho, map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!localizacao) return;
    map.flyTo([localizacao.latitude, localizacao.longitude], 14, { duration: 0.8 });
  }, [localizacao, map]);

  useEffect(() => {
    const ponto = pontos.find((p) => p.id === selecionadoId);
    if (ponto) map.flyTo([ponto.latitude, ponto.longitude], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [selecionadoId, map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export default function MapaPontos({
  pontos,
  selecionadoId = null,
  onSelecionar,
  localizacao = null,
  zoomInicial = 12,
  interativo = true,
  mostrarPopup = true,
  zoomComRoda = interativo,
}: MapaPontosProps) {
  const centro: [number, number] = pontos[0] ? [pontos[0].latitude, pontos[0].longitude] : CENTRO_PADRAO;
  const icones = useMemo(
    () => new Map(pontos.map((p) => [p.id, iconePonto(p, p.id === selecionadoId)])),
    [pontos, selecionadoId]
  );

  return (
    <MapContainer
      center={centro}
      zoom={zoomInicial}
      className="mapa-reuse"
      scrollWheelZoom={zoomComRoda}
      dragging={interativo}
      zoomControl={interativo}
      doubleClickZoom={interativo}
      attributionControl
    >
      <CamadaMapa />

      <ControleCamera pontos={pontos} selecionadoId={selecionadoId} localizacao={localizacao} />

      {localizacao && (
        <Marker
          position={[localizacao.latitude, localizacao.longitude]}
          icon={iconeUsuario}
          title="Você está aqui"
          zIndexOffset={1000}
        />
      )}

      {pontos.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={icones.get(p.id)}
          title={p.nome}
          zIndexOffset={p.id === selecionadoId ? 500 : 0}
          eventHandlers={{ click: () => onSelecionar?.(p.id) }}
        >
          {mostrarPopup && (
            <Popup>
              <div className="popup-reuse">
                <strong>{p.nome}</strong>
                <p>
                  {p.bairro} · {p.horario}
                </p>
                <div className="popup-cores" aria-label="Materiais aceitos">
                  {p.materiais.map((m) => (
                    <span
                      key={m}
                      className="ponto-cor"
                      style={{ background: CATEGORIAS[m].cor }}
                      title={CATEGORIAS[m].label}
                    />
                  ))}
                </div>
                <Link href={`/pontos/${p.id}`}>Ver detalhes e registrar descarte →</Link>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
