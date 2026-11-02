import Link from "next/link";
import { sessaoAtual } from "@/lib/auth";
import NavLinks from "./NavLinks";
import styles from "./Header.module.css";

export default async function Header() {
  // `GET /api/auth/me` devolve o usuário e o resumo de gamificação de uma vez
  const { usuario, resumo } = await sessaoAtual();

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <Link href="/" className={styles.marca} aria-label="ReUse! — página inicial">
          <span className={styles.logo} aria-hidden="true">
            ♻
          </span>
          ReUse!
        </Link>

        <NavLinks
          usuario={
            usuario && resumo
              ? {
                  primeiroNome: usuario.nome.split(" ")[0],
                  pontos: resumo.totalPontos,
                  nivel: resumo.nivel,
                  admin: usuario.papel === "ADMIN",
                }
              : null
          }
        />
      </div>
    </header>
  );
}
