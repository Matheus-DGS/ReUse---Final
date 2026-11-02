import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { exigirUsuario } from "@/lib/auth";
import ItemCard from "@/components/materiais/ItemCard";
import type { PaginaFavoritos } from "@/lib/tipos";
import styles from "../materiais/materiais.module.css";

export const metadata: Metadata = { title: "Meus favoritos" };

export default async function FavoritosPage() {
  await exigirUsuario("/favoritos");
  const { favoritos } = await api<PaginaFavoritos>("/api/paginas/favoritos");

  return (
    <div className={`wrap ${styles.pagina}`}>
      <header className={styles.cabecalho}>
        <div className="anima-entrada">
          <p className="eyebrow">Sua conta</p>
          <h1 className={styles.titulo}>Meus favoritos</h1>
          <p className={styles.descricao}>
            Materiais que você salvou para consultar depois. Toque em ★ Favoritado na página do material
            para removê-lo desta lista.
          </p>
        </div>
      </header>

      {favoritos.length > 0 ? (
        <div className={styles.grade}>
          {favoritos.map((f, i) => (
            <ItemCard
              key={f.id}
              id={f.item.id}
              nomeItem={f.item.nomeItem}
              descricao={f.item.descricao}
              categoria={f.item.categoria}
              foto={f.item.fotos.find((foto) => foto.principal)?.urlFoto ?? f.item.fotos[0]?.urlFoto}
              ordem={Math.min(i, 9)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.vazio}>
          Você ainda não favoritou nenhum material. <Link href="/materiais">Explore o catálogo</Link> e favorite
          o que for do seu interesse.
        </p>
      )}
    </div>
  );
}
