"use client";

import Link from "next/link";
import { useEffect } from "react";

// Error boundary do App Router: evita a tela branca caso o banco fique indisponível, por exemplo.
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="wrap" style={{ padding: "96px 24px", textAlign: "center" }}>
      <p className="eyebrow">Algo deu errado</p>
      <h1 style={{ fontSize: "clamp(30px, 4.5vw, 44px)", color: "var(--acento-escuro)", margin: "12px 0" }}>
        Não conseguimos carregar esta página.
      </h1>
      <p style={{ color: "var(--tinta-suave)", margin: "0 auto 28px", maxWidth: "46ch", lineHeight: 1.6 }}>
        Pode ser uma instabilidade momentânea. Tente novamente em alguns segundos.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={reset} className="btn btn-primario">
          Tentar novamente
        </button>
        <Link href="/" className="btn btn-secundario">
          Página inicial
        </Link>
      </div>
    </div>
  );
}
