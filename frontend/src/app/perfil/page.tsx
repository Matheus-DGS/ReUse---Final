import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { exigirUsuario } from "@/lib/auth";
import { CATEGORIAS, CHAVES_CATEGORIA } from "@/lib/categorias";
import { CONQUISTAS, NIVEIS } from "@/lib/gamificacao";
import { tempoRelativo } from "@/lib/geo";
import BarraNivel from "@/components/gamificacao/BarraNivel";
import MissaoDoDia from "@/components/gamificacao/MissaoDoDia";
import type { PaginaPerfil } from "@/lib/tipos";
import styles from "./perfil.module.css";

export const metadata: Metadata = { title: "Meu impacto" };

export default async function PerfilPage() {
  const usuario = await exigirUsuario("/perfil");
  const { estatisticas, nivel, porCategoria, volumesTotais, historico, posicao, missaoCumprida } =
    await api<PaginaPerfil>("/api/paginas/perfil");

  const maiorCategoria = Math.max(1, ...Object.values(porCategoria));
  const desbloqueadas = CONQUISTAS.filter((c) => c.atingiu(estatisticas));
  const agora = new Date();

  return (
    <div className={`wrap ${styles.pagina}`}>
      <section className={`card ${styles.topo}`}>
        <div className={styles.identidade}>
          <div className={styles.avatar} aria-hidden="true">
            {usuario.nome.trim()[0]?.toUpperCase()}
          </div>
          <div>
            <p className="eyebrow">Meu impacto</p>
            <h1 className={styles.nome}>{usuario.nome}</h1>
            <p className={styles.membro}>
              Membro desde{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                month: "long",
                year: "numeric",
                timeZone: "America/Sao_Paulo",
              }).format(new Date(usuario.dataCadastro))}
              {posicao && (
                <>
                  {" · "}
                  <Link href="/ranking">{posicao}º no ranking geral</Link>
                </>
              )}
            </p>
          </div>
          <div className={styles.nivelSelo}>
            <span className={styles.nivelSimbolo} aria-hidden="true">
              {nivel.simbolo}
            </span>
            <span>
              <small>Nível {nivel.numero}</small>
              {nivel.nome}
            </span>
          </div>
        </div>
        <BarraNivel
          nivel={nivel.nome}
          proximoNivel={nivel.proximo?.nome ?? null}
          progresso={nivel.progresso}
          faltam={nivel.faltam}
          total={estatisticas.totalPontos}
        />
      </section>

      <dl className={styles.numeros}>
        {[
          { rotulo: "EcoPontos", valor: estatisticas.totalPontos },
          { rotulo: "Descartes", valor: estatisticas.totalDescartes },
          { rotulo: "Volumes destinados", valor: volumesTotais },
          { rotulo: "Pontos visitados", valor: estatisticas.pontosVisitados },
        ].map((n, i) => (
          <div key={n.rotulo} className={`card anima-card ${styles.numero}`} style={{ "--ordem": i } as React.CSSProperties}>
            <dt>{n.rotulo}</dt>
            <dd>{n.valor.toLocaleString("pt-BR")}</dd>
          </div>
        ))}
      </dl>

      <MissaoDoDia cumprida={missaoCumprida} />

      <div className={styles.colunas}>
        <section className={`card ${styles.bloco}`}>
          <h2 className={styles.h2}>Volumes por material</h2>
          <ul className={styles.barras}>
            {CHAVES_CATEGORIA.map((c) => (
              <li key={c}>
                <span className={styles.barraRotulo}>{CATEGORIAS[c].label}</span>
                <span className={styles.barraTrilho}>
                  <span
                    className={styles.barraValor}
                    style={{ width: `${(porCategoria[c] / maiorCategoria) * 100}%`, background: CATEGORIAS[c].cor }}
                  />
                </span>
                <span className={styles.barraNumero}>{porCategoria[c]}</span>
              </li>
            ))}
          </ul>
          {estatisticas.totalDescartes === 0 && (
            <p className={styles.vazio}>
              Você ainda não registrou descartes. <Link href="/pontos">Encontre um ponto de coleta</Link> e comece a
              pontuar.
            </p>
          )}
        </section>

        <section className={`card ${styles.bloco}`}>
          <h2 className={styles.h2}>Trilha de níveis</h2>
          <ol className={styles.trilhaNiveis}>
            {NIVEIS.map((n, i) => {
              const atingido = estatisticas.totalPontos >= n.minimo;
              return (
                <li key={n.nome} data-atingido={atingido} data-atual={i + 1 === nivel.numero}>
                  <span className={styles.trilhaMarco} aria-hidden="true">
                    {n.simbolo}
                  </span>
                  <span className={styles.trilhaNome}>{n.nome}</span>
                  <span className={styles.trilhaMinimo}>{n.minimo} pts</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className={styles.secao}>
        <div className={styles.secaoTopo}>
          <h2 className={styles.h2}>Conquistas</h2>
          <span className={styles.contagem}>
            {desbloqueadas.length} de {CONQUISTAS.length} desbloqueadas
          </span>
        </div>
        <ul className={styles.conquistas}>
          {CONQUISTAS.map((c, i) => {
            const ok = c.atingiu(estatisticas);
            return (
              <li
                key={c.id}
                className={`anima-card ${styles.conquista}`}
                data-desbloqueada={ok}
                style={{ "--ordem": i } as React.CSSProperties}
              >
                <span className={styles.badge} aria-hidden="true">
                  {ok ? c.simbolo : "?"}
                </span>
                <div>
                  <h3>{c.titulo}</h3>
                  <p>{c.descricao}</p>
                </div>
                <span className="visually-hidden">{ok ? "Desbloqueada" : "Bloqueada"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.secao}>
        <h2 className={styles.h2}>Últimos descartes</h2>
        {historico.length > 0 ? (
          <ul className={`card ${styles.historico}`}>
            {historico.map((d) => (
              <li key={d.id}>
                <span className="ponto-cor" style={{ background: CATEGORIAS[d.categoria].cor }} aria-hidden="true" />
                <div className={styles.historicoTexto}>
                  <strong>
                    {d.quantidade} {d.quantidade === 1 ? "volume" : "volumes"} de{" "}
                    {CATEGORIAS[d.categoria].label.toLowerCase()}
                  </strong>
                  <Link href={`/pontos/${d.ponto.id}`}>
                    {d.ponto.nome} · {d.ponto.bairro}
                  </Link>
                </div>
                <span className={styles.historicoPontos}>+{d.pontos}</span>
                <span className={styles.historicoQuando}>{tempoRelativo(new Date(d.data), agora)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.vazio}>
            Nada por aqui ainda. <Link href="/pontos">Abra o mapa</Link> para encontrar o ponto mais próximo.
          </p>
        )}
      </section>
    </div>
  );
}
