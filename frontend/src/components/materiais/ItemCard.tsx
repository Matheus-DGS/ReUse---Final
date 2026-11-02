import Link from "next/link";
import Image from "next/image";
import { infoCategoria } from "@/lib/categorias";
import styles from "./ItemCard.module.css";

type ItemCardProps = {
  id: string;
  nomeItem: string;
  descricao: string;
  categoria: string;
  foto?: string | null;
  ordem?: number;
};

export default function ItemCard({ id, nomeItem, descricao, categoria, foto, ordem = 0 }: ItemCardProps) {
  const cat = infoCategoria(categoria);

  return (
    <Link
      href={`/materiais/${id}`}
      className={`card anima-card ${styles.card}`}
      style={{ "--ordem": ordem } as React.CSSProperties}
    >
      <div className={styles.imagemWrap} style={{ "--cor": cat.cor } as React.CSSProperties}>
        {foto ? (
          <Image src={foto} alt={nomeItem} fill sizes="(max-width: 860px) 100vw, 360px" className={styles.imagem} />
        ) : (
          <div className={styles.semImagem} aria-hidden="true">
            ♻
          </div>
        )}
        <span className={styles.badge} style={{ background: cat.cor }}>
          {cat.label}
        </span>
      </div>
      <div className={styles.corpo}>
        <h3 className={styles.titulo}>{nomeItem}</h3>
        <p className={styles.descricao}>{descricao}</p>
      </div>
    </Link>
  );
}
