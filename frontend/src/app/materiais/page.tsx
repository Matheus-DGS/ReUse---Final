import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { CATEGORIAS, ehCategoria } from "@/lib/categorias";
import ItemCard from "@/components/materiais/ItemCard";
import type { PaginaMateriais } from "@/lib/tipos";
import styles from "./materiais.module.css";

export const metadata: Metadata = {
  title: "Catálogo de materiais",
  description: "Consulte materiais recicláveis cadastrados pela comunidade e aprenda a descartá-los.",
};

type Props = {
  searchParams: Promise<{ categoria?: string; q?: string }>;
};

export default async function MateriaisPage({ searchParams }: Props) {
  const { categoria, q } = await searchParams;
  const categoriaFiltro = ehCategoria(categoria) ? categoria : undefined;
  const busca = q?.trim() ?? "";

  const parametros = new URLSearchParams();
  if (categoriaFiltro) parametros.set("categoria", categoriaFiltro);
  if (busca) parametros.set("q", busca);
  const consulta = parametros.toString();

  const { itens } = await api<PaginaMateriais>(`/api/paginas/materiais${consulta ? `?${consulta}` : ""}`);

  const hrefCategoria = (chave?: string) => {
    const params = new URLSearchParams();
    if (chave) params.set("categoria", chave);
    if (busca) params.set("q", busca);
    const query = params.toString();
    return query ? `/materiais?${query}` : "/materiais";
  };

  return (
    <div className={`wrap ${styles.pagina}`}>
      <header className={styles.cabecalho}>
        <div className="anima-entrada">
          <p className="eyebrow">Catálogo</p>
          <h1 className={styles.titulo}>Materiais recicláveis</h1>
          <p className={styles.descricao}>
            Consulte os materiais cadastrados pela comunidade ReUse!, filtre por categoria e descubra
            onde descartar cada um deles.
          </p>
        </div>
        <Link href="/materiais/novo" className="btn btn-primario">
          + Cadastrar material
        </Link>
      </header>

      {/* Busca via GET: funciona até sem JavaScript e mantém o filtro na URL */}
      <form action="/materiais" className={styles.busca} role="search">
        {categoriaFiltro && <input type="hidden" name="categoria" value={categoriaFiltro} />}
        <label htmlFor="q" className="visually-hidden">
          Buscar material
        </label>
        <input id="q" name="q" type="search" defaultValue={busca} placeholder="Buscar por nome ou descrição (ex.: garrafa, pilha)" />
        <button type="submit" className="btn btn-secundario btn-pequeno">
          Buscar
        </button>
      </form>

      <div className={`chips ${styles.filtros}`}>
        <Link href={hrefCategoria()} className={`chip ${!categoriaFiltro ? "ativo" : ""}`}>
          Todos
        </Link>
        {Object.entries(CATEGORIAS).map(([chave, valor]) => (
          <Link key={chave} href={hrefCategoria(chave)} className={`chip ${categoriaFiltro === chave ? "ativo" : ""}`}>
            <span className="ponto-cor" style={{ background: valor.cor }} aria-hidden="true" />
            {valor.label}
          </Link>
        ))}
      </div>

      {categoriaFiltro && (
        <div className={styles.dica} style={{ "--cor": CATEGORIAS[categoriaFiltro].cor } as React.CSSProperties}>
          <p>
            <strong>Como descartar {CATEGORIAS[categoriaFiltro].label.toLowerCase()}:</strong>{" "}
            {CATEGORIAS[categoriaFiltro].dica}
          </p>
          <Link href={`/pontos?material=${categoriaFiltro}`}>Ver pontos de coleta que aceitam →</Link>
        </div>
      )}

      {itens.length > 0 ? (
        <div className={styles.grade}>
          {itens.map((item, i) => (
            <ItemCard
              key={item.id}
              id={item.id}
              nomeItem={item.nomeItem}
              descricao={item.descricao}
              categoria={item.categoria}
              foto={item.fotos.find((f) => f.principal)?.urlFoto ?? item.fotos[0]?.urlFoto}
              ordem={Math.min(i, 9)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.vazio}>
          Nenhum material encontrado para esse filtro. <Link href="/materiais/novo">Que tal cadastrar?</Link>
        </p>
      )}
    </div>
  );
}
