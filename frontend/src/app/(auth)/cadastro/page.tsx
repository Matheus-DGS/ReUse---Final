import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import CadastroForm from "./CadastroForm";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage() {
  // Quem já está autenticado não precisa ver o formulário
  if (await usuarioAtual()) redirect("/perfil");

  return (
    <div className={`wrap ${styles.pagina}`}>
      <div className={`card ${styles.cartao}`}>
        <p className="eyebrow">Junte-se ao ReUse!</p>
        <h1 className={styles.titulo}>Criar minha conta</h1>
        <ul className={styles.beneficios}>
          <li>Registre descartes e ganhe EcoPontos</li>
          <li>Suba de nível e desbloqueie conquistas</li>
          <li>Salve materiais favoritos e sugira novos pontos</li>
        </ul>
        <Suspense>
          <CadastroForm />
        </Suspense>
      </div>
    </div>
  );
}
