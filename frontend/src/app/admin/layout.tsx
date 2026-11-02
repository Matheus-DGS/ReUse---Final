import type { Metadata } from "next";
import { api } from "@/lib/api";
import { exigirAdmin } from "@/lib/auth";
import AbasAdmin from "./AbasAdmin";
import type { PainelAdmin } from "@/lib/tipos";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Administração",
  description: "Área administrativa da plataforma ReUse!.",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Dupla proteção: o proxy exige o cookie e aqui confirmamos o papel ADMIN na API
  const usuario = await exigirAdmin("/admin");
  const { totais } = await api<PainelAdmin>("/api/admin/painel");

  return (
    <div className={`wrap ${styles.pagina}`}>
      <header className={styles.cabecalho}>
        <div className="anima-entrada">
          <p className="eyebrow">Área restrita</p>
          <h1 className={styles.titulo}>Administração do ReUse!</h1>
          <p className={styles.descricao}>
            Aprovação dos pontos sugeridos pela comunidade, curadoria do catálogo, moderação dos
            registros de descarte e gestão das contas da plataforma.
          </p>
        </div>
        <p className={styles.identificacao}>
          <strong>{usuario.nome}</strong>
          {usuario.email}
          <br />
          perfil administrador
        </p>
      </header>

      <AbasAdmin pendentes={totais.pendentes} />

      {children}
    </div>
  );
}
