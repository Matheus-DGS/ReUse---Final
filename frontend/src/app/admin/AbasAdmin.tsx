"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

const ABAS = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/pontos", label: "Pontos de coleta" },
  { href: "/admin/materiais", label: "Catálogo" },
  { href: "/admin/descartes", label: "Descartes" },
  { href: "/admin/usuarios", label: "Usuários" },
];

export default function AbasAdmin({ pendentes }: { pendentes: number }) {
  const pathname = usePathname();

  return (
    <nav className={styles.abas} aria-label="Áreas da administração">
      {ABAS.map((aba) => (
        <Link
          key={aba.href}
          href={aba.href}
          className={styles.aba}
          aria-current={pathname === aba.href ? "page" : undefined}
        >
          {aba.label}
          {aba.href === "/admin/pontos" && pendentes > 0 && (
            <span className={styles.contador} title={`${pendentes} aguardando verificação`}>
              {pendentes}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
