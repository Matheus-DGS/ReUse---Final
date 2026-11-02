import type { Metadata } from "next";
import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import FormularioMaterial from "@/components/materiais/FormularioMaterial";
import styles from "@/app/(auth)/auth.module.css";

export const metadata: Metadata = { title: "Cadastrar material" };

export default async function NovoMaterialPage() {
  await exigirUsuario("/materiais/novo");

  return (
    <div className={`wrap ${styles.pagina}`}>
      <div className={`card ${styles.cartao} ${styles.cartaoLargo}`}>
        <Link href="/materiais" className={styles.voltar}>
          ← Catálogo
        </Link>
        <p className="eyebrow">Catálogo colaborativo</p>
        <h1 className={styles.titulo}>Cadastrar material</h1>
        <FormularioMaterial />
      </div>
    </div>
  );
}
