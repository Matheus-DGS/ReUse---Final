import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiOuNulo } from "@/lib/api";
import { usuarioAtual } from "@/lib/auth";
import { infoCategoria } from "@/lib/categorias";
import { TIPOS_PONTO } from "@/lib/pontos";
import FavoriteButton from "@/components/materiais/FavoriteButton";
import type { PaginaMaterial } from "@/lib/tipos";
import styles from "./item.module.css";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dados = await apiOuNulo<PaginaMaterial>(`/api/paginas/materiais/${id}`);
  return dados
    ? { title: dados.item.nomeItem, description: dados.item.descricao }
    : { title: "Material não encontrado" };
}

export default async function ItemDetalhePage({ params }: Props) {
  const { id } = await params;

  const dados = await apiOuNulo<PaginaMaterial>(`/api/paginas/materiais/${id}`);
  if (!dados) notFound();

  const { item, favoritado, pontosQueAceitam, totalPontos } = dados;
  const usuario = await usuarioAtual();
  const cat = infoCategoria(item.categoria);
  const fotoPrincipal = item.fotos[0]?.urlFoto;

  return (
    <div className={`wrap ${styles.pagina}`}>
      <Link href="/materiais" className={styles.voltar}>
        ← Catálogo de materiais
      </Link>

      <div className={styles.grade}>
        <div className={`anima-card ${styles.imagemWrap}`} style={{ "--cor": cat.cor } as React.CSSProperties}>
          {fotoPrincipal ? (
            <Image src={fotoPrincipal} alt={item.nomeItem} fill sizes="(max-width: 760px) 100vw, 540px" className={styles.imagem} priority />
          ) : (
            <div className={styles.semImagem} aria-hidden="true">
              ♻
            </div>
          )}
        </div>

        <div>
          <span className={styles.badge} style={{ background: cat.cor }}>
            {cat.label}
          </span>
          <h1 className={`anima-entrada ${styles.titulo}`}>{item.nomeItem}</h1>
          <p className={styles.descricao}>{item.descricao}</p>

          {cat.dica && (
            <p className={styles.dica}>
              <strong>Como preparar:</strong> {cat.dica}
            </p>
          )}

          <dl className={styles.meta}>
            <div>
              <dt>Cadastrado por</dt>
              <dd>{item.usuario.nome}</dd>
            </div>
            <div>
              <dt>Publicado em</dt>
              <dd>
                {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(
                  new Date(item.dataPublicacao)
                )}
              </dd>
            </div>
          </dl>

          <FavoriteButton itemId={item.id} favoritadoInicial={favoritado} autenticado={Boolean(usuario)} />
        </div>
      </div>

      {/* Integração com a área de Pontos de Coleta */}
      <section className={styles.ondeDescartar}>
        <div className={styles.ondeTopo}>
          <div>
            <p className="eyebrow">Descarte consciente</p>
            <h2 className={styles.h2}>Onde descartar {cat.label.toLowerCase()}</h2>
          </div>
          <Link href={`/pontos?material=${item.categoria}`} className="btn btn-primario">
            Ver os {totalPontos} pontos no mapa
          </Link>
        </div>
        {pontosQueAceitam.length > 0 ? (
          <ul className={styles.pontos}>
            {pontosQueAceitam.map((p, i) => (
              <li key={p.id} className="anima-card" style={{ "--ordem": i } as React.CSSProperties}>
                <Link href={`/pontos/${p.id}`} className={`card ${styles.ponto}`}>
                  <span className="selo">{TIPOS_PONTO[p.tipo].label}</span>
                  <strong>{p.nome}</strong>
                  <span>
                    {p.bairro} · {p.horario}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.vazio}>
            Ainda não há pontos cadastrados para este material. <Link href="/pontos/novo">Sugira um ponto</Link>.
          </p>
        )}
      </section>
    </div>
  );
}
