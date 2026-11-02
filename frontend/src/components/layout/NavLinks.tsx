"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";

type NavLinksProps = {
  usuario: { primeiroNome: string; pontos: number; nivel: string; admin: boolean } | null;
};

const LINKS = [
  { href: "/pontos", label: "Pontos de coleta" },
  { href: "/materiais", label: "Materiais" },
  { href: "/ranking", label: "Ranking" },
  { href: "/assistente", label: "Assistente Eco" },
];

export default function NavLinks({ usuario }: NavLinksProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  // Fecha o menu mobile ao navegar
  useEffect(() => setAberto(false), [pathname]);

  const ativo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={styles.hamburguer}
        aria-expanded={aberto}
        aria-controls="menu-principal"
        onClick={() => setAberto((v) => !v)}
      >
        <span className="visually-hidden">{aberto ? "Fechar menu" : "Abrir menu"}</span>
        <span className={styles.barras} data-aberto={aberto} aria-hidden="true" />
      </button>

      <div id="menu-principal" className={styles.menu} data-aberto={aberto}>
        <nav className={styles.nav} aria-label="Principal">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={styles.link}
              aria-current={ativo(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          {usuario && (
            <Link
              href="/favoritos"
              className={styles.link}
              aria-current={ativo("/favoritos") ? "page" : undefined}
            >
              Favoritos
            </Link>
          )}
          {usuario?.admin && (
            <Link
              href="/admin"
              className={styles.link}
              aria-current={ativo("/admin") ? "page" : undefined}
              title="Área administrativa da plataforma"
            >
              Administração
            </Link>
          )}
        </nav>

        <div className={styles.acoes}>
          {usuario ? (
            <>
              <Link
                href="/perfil"
                className={styles.pilula}
                aria-current={ativo("/perfil") ? "page" : undefined}
                title="Ver meu impacto"
              >
                <span className={styles.pilulaNivel}>{usuario.nivel}</span>
                <span className={styles.pilulaPontos}>
                  {usuario.pontos.toLocaleString("pt-BR")} <small>EcoPontos</small>
                </span>
              </Link>
              <button onClick={sair} className="btn btn-secundario btn-pequeno">
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secundario btn-pequeno">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn btn-primario btn-pequeno">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
