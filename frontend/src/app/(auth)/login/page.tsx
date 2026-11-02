import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import LoginForm from "./LoginForm";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  // Quem já está autenticado não precisa ver o formulário
  if (await usuarioAtual()) redirect("/perfil");

  return (
    <div className={`wrap ${styles.pagina}`}>
      <div className={`card ${styles.cartao}`}>
        <p className="eyebrow">Bem-vindo de volta</p>
        <h1 className={styles.titulo}>Entrar no ReUse!</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
