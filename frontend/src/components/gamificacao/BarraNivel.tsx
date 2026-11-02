import styles from "./Gamificacao.module.css";

type BarraNivelProps = {
  nivel: string;
  proximoNivel: string | null;
  progresso: number;
  faltam: number;
  total: number;
};

/** Barra de experiência (Plano de Gamificação 6.2 e 6.4) — preenchimento animado ao carregar. */
export default function BarraNivel({ nivel, proximoNivel, progresso, faltam, total }: BarraNivelProps) {
  const porcentagem = Math.round(progresso * 100);

  return (
    <div className={styles.barraNivel}>
      <div className={styles.barraRotulos}>
        <span>
          Nível <strong>{nivel}</strong>
        </span>
        <span className={styles.barraTotal}>{total.toLocaleString("pt-BR")} EcoPontos</span>
      </div>
      <div
        className={styles.trilho}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentagem}
        aria-label={proximoNivel ? `Progresso até o nível ${proximoNivel}` : "Nível máximo atingido"}
      >
        <div className={styles.preenchimento} style={{ "--progresso": `${porcentagem}%` } as React.CSSProperties} />
      </div>
      <p className={styles.barraLegenda}>
        {proximoNivel
          ? `Faltam ${faltam} EcoPontos para o nível ${proximoNivel}.`
          : "Você atingiu o nível máximo. Continue inspirando a comunidade!"}
      </p>
    </div>
  );
}
