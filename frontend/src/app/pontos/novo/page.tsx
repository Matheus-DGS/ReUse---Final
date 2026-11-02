import type { Metadata } from "next";
import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import FormularioPonto from "@/components/pontos/FormularioPonto";

export const metadata: Metadata = {
  title: "Sugerir ponto de coleta",
};

export default async function NovoPontoPage() {
  await exigirUsuario("/pontos/novo");

  return (
    <div className="wrap" style={{ paddingTop: 28 }}>
      <Link href="/pontos" style={{ fontSize: 14, fontWeight: 600, color: "var(--tinta-suave)" }}>
        ← Voltar ao mapa
      </Link>
      <header className="anima-entrada" style={{ marginTop: 18, maxWidth: "62ch" }}>
        <p className="eyebrow">Mapeamento colaborativo</p>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 42px)", color: "var(--acento-escuro)", margin: "10px 0 12px" }}>
          Sugerir um ponto de coleta
        </h1>
        <p style={{ color: "var(--tinta-suave)", lineHeight: 1.6, margin: 0 }}>
          Ajude outras pessoas a descartar do jeito certo. Informe o que o local recebe e marque a
          posição exata no mapa.
        </p>
      </header>
      <FormularioPonto />
    </div>
  );
}
