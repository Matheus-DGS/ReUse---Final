import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { api } from "@/lib/api";
import ExploradorPontos from "@/components/pontos/ExploradorPontos";
import MissaoDoDia from "@/components/gamificacao/MissaoDoDia";
import type { PaginaPontos } from "@/lib/tipos";
import styles from "./pontos.module.css";

export const metadata: Metadata = {
  title: "Pontos de coleta",
  description:
    "Mapa de ecopontos, PEVs e cooperativas: filtre pelo material, encontre o ponto mais próximo e registre seus descartes.",
};

export default async function PontosPage() {
  const { pontos, totalDescartes, sugeridos, missaoCumprida } = await api<PaginaPontos>("/api/paginas/pontos");

  return (
    <div className={`wrap ${styles.pagina}`}>
      <header className={styles.cabecalho}>
        <div className="anima-entrada">
          <p className="eyebrow">Descarte consciente</p>
          <h1 className={styles.titulo}>Onde descartar cada material</h1>
          <p className={styles.descricao}>
            Ecopontos, PEVs, cooperativas e parceiros em um só mapa. Filtre pelo material que você
            tem em mãos, descubra o ponto mais perto e ganhe EcoPontos ao registrar o descarte.
          </p>
          <dl className={styles.numeros}>
            <div>
              <dt>Pontos mapeados</dt>
              <dd>{pontos.length}</dd>
            </div>
            <div>
              <dt>Descartes registrados</dt>
              <dd>{totalDescartes}</dd>
            </div>
            <div>
              <dt>Sugeridos pela comunidade</dt>
              <dd>{sugeridos}</dd>
            </div>
          </dl>
        </div>
        <MissaoDoDia cumprida={missaoCumprida} />
      </header>

      <Suspense>
        <ExploradorPontos pontos={pontos} />
      </Suspense>

      <aside className={styles.sugerir}>
        <div>
          <h2 className={styles.sugerirTitulo}>Conhece um ponto que não está no mapa?</h2>
          <p>
            Sugira o local para a comunidade e ganhe EcoPontos. Pontos sugeridos aparecem com o selo
            “Comunidade” até serem verificados pela administração do ReUse!.
          </p>
        </div>
        <Link href="/pontos/novo" className="btn btn-primario">
          Sugerir ponto de coleta
        </Link>
      </aside>

      <p className={styles.nota}>
        Os pontos pré-cadastrados são dados de demonstração do projeto acadêmico. Confirme horários e
        materiais aceitos com o local antes de ir.
      </p>
    </div>
  );
}
