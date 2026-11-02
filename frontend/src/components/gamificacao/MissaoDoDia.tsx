import Link from "next/link";
import { CATEGORIAS } from "@/lib/categorias";
import { missaoDoDia } from "@/lib/gamificacao";
import styles from "./Gamificacao.module.css";

type MissaoDoDiaProps = {
  cumprida?: boolean;
  compacta?: boolean;
};

export default function MissaoDoDia({ cumprida = false, compacta = false }: MissaoDoDiaProps) {
  const missao = missaoDoDia();
  const cor = CATEGORIAS[missao.categoria].cor;

  return (
    <aside
      className={`${styles.missao} ${compacta ? styles.missaoCompacta : ""}`}
      style={{ "--cor-missao": cor } as React.CSSProperties}
      aria-label="Missão do dia"
    >
      <div className={styles.missaoIcone} aria-hidden="true">
        {cumprida ? "✓" : "◎"}
      </div>
      <div className={styles.missaoTexto}>
        <p className="eyebrow">Missão do dia {cumprida && "· concluída"}</p>
        <h2 className={styles.missaoTitulo}>{missao.titulo}</h2>
        {!compacta && <p className={styles.missaoDescricao}>{missao.descricao}</p>}
      </div>
      {!cumprida && !compacta && (
        <Link href={`/pontos?material=${missao.categoria}`} className={styles.missaoCta}>
          Ver pontos que aceitam {CATEGORIAS[missao.categoria].label.toLowerCase()} →
        </Link>
      )}
      <span className={styles.missaoBonus}>+{missao.bonus}</span>
    </aside>
  );
}
