import type { Metadata } from "next";
import Link from "next/link";
import { apiPublica } from "@/lib/api";
import { usuarioAtual } from "@/lib/auth";
import type { LinhaRanking } from "@/lib/tipos";
import styles from "./ranking.module.css";

export const metadata: Metadata = {
  title: "Ranking",
  description: "As pessoas que mais destinaram resíduos corretamente na comunidade ReUse!.",
};

type Props = { searchParams: Promise<{ periodo?: string }> };

export default async function RankingPage({ searchParams }: Props) {
  const { periodo: periodoParam } = await searchParams;
  const periodo = periodoParam === "mes" ? "mes" : "geral";

  const [usuario, { ranking }] = await Promise.all([
    usuarioAtual(),
    apiPublica<{ ranking: LinhaRanking[] }>(`/api/ranking?periodo=${periodo}&limite=50`),
  ]);

  const podio = ranking.slice(0, 3);
  const demais = ranking.slice(3, 20);
  const minhaPosicao = usuario ? ranking.find((r) => r.usuarioId === usuario.id) : undefined;
  const mesAtual = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" }).format(new Date());

  return (
    <div className={`wrap ${styles.pagina}`}>
      <header className={`anima-entrada ${styles.cabecalho}`}>
        <p className="eyebrow">Comunidade</p>
        <h1 className={styles.titulo}>Ranking de EcoPontos</h1>
        <p className={styles.descricao}>
          Quem mais levou resíduos ao destino certo, sugeriu pontos e alimentou o catálogo. Uma
          competição saudável em que o planeta sempre ganha.
        </p>
      </header>

      <nav className={styles.abas} aria-label="Período do ranking">
        <Link href="/ranking" aria-current={periodo === "geral" ? "page" : undefined}>
          Geral
        </Link>
        <Link href="/ranking?periodo=mes" aria-current={periodo === "mes" ? "page" : undefined}>
          Em {mesAtual}
        </Link>
      </nav>

      {ranking.length === 0 ? (
        <p className={styles.vazio}>
          Ninguém pontuou neste período ainda. <Link href="/pontos">Registre um descarte</Link> e assuma a
          liderança!
        </p>
      ) : (
        <>
          <ol className={styles.podio}>
            {podio.map((r) => (
              <li
                key={r.usuarioId}
                className={styles.degrau}
                data-posicao={r.posicao}
                data-voce={r.usuarioId === usuario?.id}
              >
                <span className={styles.medalha} aria-hidden="true">
                  {r.posicao}
                </span>
                <strong className={styles.podioNome}>{r.nome}</strong>
                <span className={styles.podioPontos}>{r.pontos.toLocaleString("pt-BR")} pts</span>
                <span className={styles.podioDescartes}>{r.descartes} descartes</span>
                <span className={styles.base} aria-hidden="true" />
              </li>
            ))}
          </ol>

          {demais.length > 0 && (
            <ol className={`card ${styles.lista}`} start={4}>
              {demais.map((r, i) => (
                <li
                  key={r.usuarioId}
                  className="anima-card"
                  data-voce={r.usuarioId === usuario?.id}
                  style={{ "--ordem": i } as React.CSSProperties}
                >
                  <span className={styles.posicao}>{r.posicao}º</span>
                  <span className={styles.nome}>{r.nome}</span>
                  <span className={styles.descartes}>{r.descartes} descartes</span>
                  <span className={styles.pontos}>{r.pontos.toLocaleString("pt-BR")} pts</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <aside className={styles.voce}>
        {usuario ? (
          minhaPosicao ? (
            <p>
              Você está em <strong>{minhaPosicao.posicao}º lugar</strong> com {minhaPosicao.pontos} EcoPontos.{" "}
              <Link href="/perfil">Ver meu impacto →</Link>
            </p>
          ) : (
            <p>
              Você ainda não pontuou {periodo === "mes" ? "neste mês" : ""}.{" "}
              <Link href="/pontos">Registre seu primeiro descarte →</Link>
            </p>
          )
        ) : (
          <p>
            <Link href="/cadastro">Crie sua conta</Link> para aparecer no ranking e acompanhar seu impacto.
          </p>
        )}
      </aside>
    </div>
  );
}
