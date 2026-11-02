import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="wrap" style={{ padding: "96px 24px", textAlign: "center" }}>
      <p className="eyebrow">Erro 404</p>
      <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", color: "var(--acento-escuro)", margin: "12px 0" }}>
        Este caminho foi para a reciclagem.
      </h1>
      <p style={{ color: "var(--tinta-suave)", margin: "0 auto 28px", maxWidth: "46ch", lineHeight: 1.6 }}>
        A página que você procura não existe ou foi removida. Que tal procurar um ponto de coleta?
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/pontos" className="btn btn-primario">
          Ver pontos de coleta
        </Link>
        <Link href="/" className="btn btn-secundario">
          Página inicial
        </Link>
      </div>
    </div>
  );
}
