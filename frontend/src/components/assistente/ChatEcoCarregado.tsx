"use client";

import dynamic from "next/dynamic";

// O chat usa sessionStorage e APIs de voz do navegador: renderiza só no cliente
const ChatEcoCarregado = dynamic(() => import("./ChatEco"), {
  ssr: false,
  loading: () => <div className="esqueleto" style={{ height: "100%", minHeight: 520 }} aria-label="Carregando assistente" />,
});

export default ChatEcoCarregado;
