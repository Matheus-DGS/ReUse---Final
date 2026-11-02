import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <div>
          <p className={styles.marca}>♻ ReUse!</p>
          <p className={styles.texto}>
            Plataforma de incentivo à reciclagem: encontre onde descartar, aprenda a separar e
            acompanhe o seu impacto.
          </p>
        </div>
        <nav className={styles.links} aria-label="Rodapé">
          <Link href="/pontos">Pontos de coleta</Link>
          <Link href="/pontos/novo">Sugerir ponto</Link>
          <Link href="/materiais">Materiais</Link>
          <Link href="/ranking">Ranking</Link>
          <Link href="/assistente">Assistente Eco</Link>
          <Link href="/api/pontos">API pública</Link>
        </nav>
        <p className={styles.creditos}>
          Projeto acadêmico · FIAP · Next.js na Vercel + API Node.js/Express com Prisma e PostgreSQL
        </p>
      </div>
    </footer>
  );
}
