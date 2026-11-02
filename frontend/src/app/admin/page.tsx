import Link from "next/link";
import { api } from "@/lib/api";
import { CATEGORIAS } from "@/lib/categorias";
import { TIPOS_PONTO } from "@/lib/pontos";
import BotaoAcao from "@/components/admin/BotaoAcao";
import type { PainelAdmin } from "@/lib/tipos";
import styles from "./admin.module.css";

const diaCurto = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

export default async function PainelAdminPage() {
  const { totais, categorias, tipos, serie, pendentes, topPontos, ultimosUsuarios } =
    await api<PainelAdmin>("/api/admin/painel");

  const maiorDia = Math.max(1, ...serie.map((d) => d.volumes));
  const maiorCategoria = Math.max(1, ...categorias.map((c) => c.volumes));

  const metricas = [
    { rotulo: "Pessoas cadastradas", valor: totais.usuarios, nota: `${totais.admins} com perfil administrador` },
    { rotulo: "Pontos de coleta", valor: totais.pontos, nota: `${totais.verificados} verificados · ${totais.pendentes} pendentes` },
    { rotulo: "Descartes registrados", valor: totais.descartes, nota: `${totais.descartesHoje} hoje · ${totais.descartesMes} no mês` },
    { rotulo: "Volumes destinados", valor: totais.volumesDestinados, nota: "sacolas e caixas levadas aos pontos" },
    { rotulo: "EcoPontos distribuídos", valor: totais.ecopontosDistribuidos, nota: "somando bônus de missão e exploração" },
    { rotulo: "Materiais no catálogo", valor: totais.materiais, nota: "cadastrados pela comunidade" },
  ];

  return (
    <>
      <dl className={styles.metricas}>
        {metricas.map((m, i) => (
          <div key={m.rotulo} className={`card anima-card ${styles.metrica}`} style={{ "--ordem": i } as React.CSSProperties}>
            <dt>{m.rotulo}</dt>
            <dd>{m.valor.toLocaleString("pt-BR")}</dd>
            <small>{m.nota}</small>
          </div>
        ))}
      </dl>

      <div className={styles.colunas}>
        <section className={`card ${styles.bloco}`}>
          <div className={styles.blocoTopo}>
            <h2 className={styles.h2}>Volumes por dia</h2>
            <span className={styles.legenda}>últimos {serie.length} dias</span>
          </div>
          <div className={styles.grafico} role="img" aria-label="Volumes destinados por dia nas últimas duas semanas">
            {serie.map((d) => (
              <div key={d.dia} className={styles.coluna} title={`${dataCurta.format(new Date(d.dia))}: ${d.volumes} volumes em ${d.descartes} descartes`}>
                <span
                  className={styles.colunaBarra}
                  data-vazio={d.volumes === 0}
                  style={{ height: `${Math.max(2, (d.volumes / maiorDia) * 100)}%` }}
                />
                <span className={styles.colunaRotulo}>{diaCurto.format(new Date(d.dia))}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`card ${styles.bloco}`}>
          <div className={styles.blocoTopo}>
            <h2 className={styles.h2}>Volumes por material</h2>
            <span className={styles.legenda}>histórico</span>
          </div>
          <ul className={styles.barras}>
            {categorias.map((c) => (
              <li key={c.categoria}>
                <span>{CATEGORIAS[c.categoria].label}</span>
                <span className={styles.barraTrilho}>
                  <span
                    className={styles.barraValor}
                    style={{ width: `${(c.volumes / maiorCategoria) * 100}%`, background: CATEGORIAS[c.categoria].cor }}
                  />
                </span>
                <span className={styles.barraNumero}>
                  {c.volumes} · {c.pontos} pts
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={`card ${styles.bloco}`} style={{ marginBottom: 16 }}>
        <div className={styles.blocoTopo}>
          <h2 className={styles.h2}>Aguardando verificação</h2>
          <Link href="/admin/pontos?status=pendentes" className={styles.legenda}>
            ver todos →
          </Link>
        </div>
        {pendentes.length > 0 ? (
          <ul className={styles.pendentes}>
            {pendentes.slice(0, 6).map((p) => (
              <li key={p.id} className={styles.pendente}>
                <div className={styles.pendenteInfo}>
                  <strong>{p.nome}</strong>
                  <span className={styles.secundario}>
                    {TIPOS_PONTO[p.tipo].label} · {p.bairro}, {p.cidade} · sugerido por{" "}
                    {p.criadoPor?.nome ?? "conta removida"} em {dataCurta.format(new Date(p.dataCadastro))}
                  </span>
                  <span className={styles.cores} aria-label={`Aceita ${p.materiais.length} materiais`}>
                    {p.materiais.map((m) => (
                      <span key={m} className="ponto-cor" style={{ background: CATEGORIAS[m].cor }} title={CATEGORIAS[m].label} />
                    ))}
                  </span>
                </div>
                <div className={styles.acoes}>
                  <Link href={`/pontos/${p.id}`} className={styles.botao} target="_blank">
                    Conferir ↗
                  </Link>
                  <BotaoAcao caminho={`/api/admin/pontos/${p.id}`} metodo="PATCH" corpo={{ verificado: true }} variante="aprovar">
                    ✓ Aprovar
                  </BotaoAcao>
                  <BotaoAcao
                    caminho={`/api/admin/pontos/${p.id}`}
                    metodo="DELETE"
                    variante="perigo"
                    confirmar={`Excluir o ponto "${p.nome}"? Os descartes registrados nele também serão apagados.`}
                  >
                    Excluir
                  </BotaoAcao>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.vazio}>Nenhum ponto sugerido aguardando verificação. 🌱</p>
        )}
      </section>

      <div className={styles.colunas}>
        <section className={`card ${styles.bloco}`}>
          <div className={styles.blocoTopo}>
            <h2 className={styles.h2}>Pontos mais movimentados</h2>
            <span className={styles.legenda}>top 5</span>
          </div>
          <div className={styles.tabelaWrap} style={{ boxShadow: "none", border: "none" }}>
            <table className={styles.tabela} style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>Ponto</th>
                  <th>Tipo</th>
                  <th className={styles.numerico}>Descartes</th>
                </tr>
              </thead>
              <tbody>
                {topPontos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/pontos/${p.id}`} className={styles.principal}>
                        {p.nome}
                      </Link>
                      <span className={styles.secundario}>{p.bairro}</span>
                    </td>
                    <td>
                      <span className="selo">{TIPOS_PONTO[p.tipo].label}</span>
                    </td>
                    <td className={styles.numerico}>{p.totalDescartes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`card ${styles.bloco}`}>
          <div className={styles.blocoTopo}>
            <h2 className={styles.h2}>Tipos de ponto</h2>
            <Link href="/admin/usuarios" className={styles.legenda}>
              últimos cadastros →
            </Link>
          </div>
          <ul className={styles.barras} style={{ marginBottom: 20 }}>
            {tipos.map((t) => (
              <li key={t.tipo}>
                <span>{TIPOS_PONTO[t.tipo].label}</span>
                <span className={styles.barraTrilho}>
                  <span
                    className={styles.barraValor}
                    style={{ width: `${(t.total / Math.max(1, totais.pontos)) * 100}%`, background: "var(--acento)" }}
                  />
                </span>
                <span className={styles.barraNumero}>{t.total}</span>
              </li>
            ))}
          </ul>
          <ul className={styles.pendentes}>
            {ultimosUsuarios.map((u) => (
              <li key={u.id} className={styles.pendente} style={{ borderLeftColor: "var(--acento)" }}>
                <div className={styles.pendenteInfo}>
                  <strong>{u.nome}</strong>
                  <span className={styles.secundario}>
                    {u.email} · entrou em {dataCurta.format(new Date(u.dataCadastro))}
                  </span>
                </div>
                {u.papel === "ADMIN" && <span className="selo selo-verificado">administrador</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className={styles.nota}>
        Esta área consolida a administração desenhada na fase 06 do projeto. Todas as ações passam
        pela API <code>/api/admin/*</code>, que só responde a contas com papel <strong>ADMIN</strong>.
      </p>
    </>
  );
}
