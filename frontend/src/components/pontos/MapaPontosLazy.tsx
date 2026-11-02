"use client";

import dynamic from "next/dynamic";

// O Leaflet depende de `window`, então o mapa é carregado apenas no navegador (sem SSR),
// exibindo um esqueleto animado enquanto o bundle do mapa chega.
const MapaPontosLazy = dynamic(() => import("./MapaPontos"), {
  ssr: false,
  loading: () => (
    <div className="esqueleto" style={{ width: "100%", height: "100%", minHeight: 240 }} aria-label="Carregando mapa" />
  ),
});

export default MapaPontosLazy;
