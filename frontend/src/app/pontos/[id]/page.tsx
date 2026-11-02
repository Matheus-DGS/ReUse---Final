import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiOuNulo } from "@/lib/api";
import { usuarioAtual } from "@/lib/auth";
import { CATEGORIAS } from "@/lib/categorias";
import { TIPOS_PONTO, linkRota } from "@/lib/pontos";
import { LIMITE_DESCARTES_DIA, PONTOS_SUGESTAO_PONTO, missaoDoDia } from "@/lib/gamificacao";
import { tempoRelativo } from "@/lib/geo";
import MapaPontosLazy from "@/components/pontos/MapaPontosLazy";
import RegistrarDescarte from "@/components/gamificacao/RegistrarDescarte";
import type { PaginaPonto } from "@/lib/tipos";
import styles from "./ponto.module.css";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dados = await apiOuNulo<PaginaPonto>(`/api/paginas/pontos/${id}`);
  if (!dados) return { title: "Ponto não encontrado" };
  return {
    title: dados.ponto.nome,
    description: `Materiais aceitos, horário e como chegar ao ponto de coleta ${dados.ponto.nome}, em ${dados.ponto.bairro}.`,
  };
}

export default async function PontoDetalhePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { novo } = await searchParams;

  const dados = await apiOuNulo<PaginaPonto>(`/api/paginas/pontos/${id}`);
  if (!dados) notFound();

  const { ponto, descartesHoje } = dados;
  const usuario = await usuarioAtual();
  const missao = missaoDoDia();
  const agora = new Date();
  const recemCriadoPorMim = novo === "1" && usuario && ponto.criadoPor?.id === usuario.id;

  return (
    <div className={`wrap ${styles.pagina}`}>
      <Link href="/pontos" className={styles.voltar}>
        ← Todos os pontos de coleta
      </Link>

      {recemCriadoPorMim && (
        <div className="sucesso" role="status">
          <strong>Ponto sugerido com sucesso!</strong> Você ganhou +{PONTOS_SUGESTAO_PONTO} EcoPontos.
          Ele já aparece no mapa com o selo “Comunidade”.
        </div>
      )}

      <div className={styles.grade}>
        <div className={styles.principal}>
          <div className={`anima-entrada ${styles.selos}`}>
            <span className="selo">{TIPOS_PONTO[ponto.tipo].label}</span>
            {ponto.verificado ? (
              <span className="selo selo-verificado">✓ Verificado pela equipe</span>
            ) : (
              <span className="selo selo-comunidade">Sugerido pela comunidade</span>
            )}
          </div>
          <h1 className={`anima-entrada ${styles.titulo}`}>{ponto.nome}</h1>
          <p className={styles.descricao}>{ponto.descricao}</p>

          <dl className={styles.info}>
            <div>
              <dt>Endereço</dt>
              <dd>
                {ponto.endereco}
                <br />
                {ponto.bairro} · {ponto.cidade}
              </dd>
            </div>
            <div>
              <dt>Horário</dt>
              <dd>{ponto.horario}</dd>
            </div>
            {ponto.telefone && (
              <div>
                <dt>Telefone</dt>
                <dd>
                  <a href={`tel:${ponto.telefone.replace(/\D/g, "")}`}>{ponto.telefone}</a>
                </dd>
              </div>
            )}
            <div>
              <dt>Tipo de ponto</dt>
              <dd>{TIPOS_PONTO[ponto.tipo].descricao}</dd>
            </div>
          </dl>

          <div className={styles.acoes}>
            <a
              href={linkRota(ponto.latitude, ponto.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primario"
            >
              Traçar rota até aqui ↗
            </a>
            <Link href={`/pontos?material=${ponto.materiais[0] ?? ""}`} className="btn btn-secundario">
              Ver pontos parecidos
            </Link>
          </div>

          <section className={styles.secao}>
            <h2 className={styles.h2}>Materiais aceitos</h2>
            <ul className={styles.materiais}>
              {ponto.materiais.map((m, i) => (
                <li
                  key={m}
                  className={`anima-card ${styles.material}`}
                  style={{ "--ordem": i, "--cor": CATEGORIAS[m].cor } as React.CSSProperties}
                >
                  <h3>
                    {CATEGORIAS[m].label}
                    {m === missao.categoria && <span className={styles.missaoTag}>missão do dia</span>}
                  </h3>
                  <p>{CATEGORIAS[m].dica}</p>
                  <Link href={`/materiais?categoria=${m}`}>Ver no catálogo →</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.secao}>
            <div className={styles.secaoTopo}>
              <h2 className={styles.h2}>Atividade da comunidade</h2>
              <span className={styles.contagem}>
                {ponto.totalDescartes} descartes · {ponto.volumes} volumes
              </span>
            </div>
            {ponto.atividade.length > 0 ? (
              <ul className={styles.atividade}>
                {ponto.atividade.map((d) => (
                  <li key={d.id}>
                    <span className="ponto-cor" style={{ background: CATEGORIAS[d.categoria].cor }} aria-hidden="true" />
                    <span>
                      <strong>{d.autor}</strong> descartou {d.quantidade}{" "}
                      {d.quantidade === 1 ? "volume" : "volumes"} de {CATEGORIAS[d.categoria].label.toLowerCase()}
                    </span>
                    <span className={styles.quando}>{tempoRelativo(new Date(d.data), agora)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.vazio}>Ninguém registrou descartes aqui ainda. Que tal ser o primeiro?</p>
            )}
            {ponto.criadoPor && <p className={styles.autor}>Ponto sugerido por {ponto.criadoPor.nome}.</p>}
          </section>
        </div>

        <aside className={styles.lateral}>
          <div className={styles.mapa}>
            <MapaPontosLazy
              pontos={[{ ...ponto, distanciaKm: null }]}
              selecionadoId={ponto.id}
              mostrarPopup={false}
              zoomComRoda={false}
              zoomInicial={15}
            />
          </div>

          <RegistrarDescarte
            pontoId={ponto.id}
            materiais={ponto.materiais}
            autenticado={Boolean(usuario)}
            categoriaMissao={missao.categoria}
            restantesHoje={Math.max(0, LIMITE_DESCARTES_DIA - descartesHoje)}
          />
        </aside>
      </div>
    </div>
  );
}
