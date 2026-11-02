import Link from "next/link";
import { api } from "@/lib/api";
import { CATEGORIAS } from "@/lib/categorias";
import { TIPOS_PONTO } from "@/lib/pontos";
import BotaoAcao from "@/components/admin/BotaoAcao";
import type { PontoAdmin } from "@/lib/tipos";
import styles from "../admin.module.css";

const dataCurta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function AdminPontosPage({ searchParams }: Props) {
  const { q = "", status = "todos" } = await searchParams;

  const parametros = new URLSearchParams();
  if (q.trim()) parametros.set("q", q.trim());
  if (status === "pendentes" || status === "verificados") parametros.set("status", status);
  const consulta = parametros.toString();

  const { pontos, total } = await api<{ pontos: PontoAdmin[]; total: number }>(
    `/api/admin/pontos${consulta ? `?${consulta}` : ""}`
  );

  return (
    <>
      <form className={styles.filtros} action="/admin/pontos">
        <label htmlFor="q" className="visually-hidden">
          Buscar ponto
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar por nome, bairro ou endereço" />
        <label htmlFor="status" className="visually-hidden">
          Situação
        </label>
        <select id="status" name="status" defaultValue={status}>
          <option value="todos">Todas as situações</option>
          <option value="pendentes">Aguardando verificação</option>
          <option value="verificados">Verificados</option>
        </select>
        <button type="submit" className="btn btn-secundario btn-pequeno">
          Filtrar
        </button>
        <span className={styles.legenda}>{total} pontos</span>
      </form>

      <div className={styles.tabelaWrap}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Ponto</th>
              <th>Tipo</th>
              <th>Materiais</th>
              <th>Situação</th>
              <th>Sugerido por</th>
              <th className={styles.numerico}>Descartes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pontos.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/pontos/${p.id}`} className={styles.principal} target="_blank">
                    {p.nome}
                  </Link>
                  <span className={styles.secundario}>
                    {p.endereco} · {p.bairro}, {p.cidade}
                  </span>
                  <span className={styles.secundario}>{p.horario}</span>
                </td>
                <td>
                  <span className="selo">{TIPOS_PONTO[p.tipo].label}</span>
                </td>
                <td>
                  <span className={styles.cores}>
                    {p.materiais.map((m) => (
                      <span
                        key={m}
                        className="ponto-cor"
                        style={{ background: CATEGORIAS[m].cor }}
                        title={CATEGORIAS[m].label}
                      />
                    ))}
                  </span>
                  <span className={styles.secundario}>{p.materiais.map((m) => CATEGORIAS[m].label).join(", ")}</span>
                </td>
                <td>
                  {p.verificado ? (
                    <span className="selo selo-verificado">✓ Verificado</span>
                  ) : (
                    <span className="selo selo-comunidade">Pendente</span>
                  )}
                </td>
                <td>
                  {p.criadoPor ? (
                    <>
                      <span className={styles.principal}>{p.criadoPor.nome}</span>
                      <span className={styles.secundario}>{p.criadoPor.email}</span>
                    </>
                  ) : (
                    <span className={styles.secundario}>equipe ReUse!</span>
                  )}
                  <span className={styles.secundario}>em {dataCurta.format(new Date(p.dataCadastro))}</span>
                </td>
                <td className={styles.numerico}>{p.totalDescartes}</td>
                <td>
                  <div className={styles.acoes}>
                    <BotaoAcao
                      caminho={`/api/admin/pontos/${p.id}`}
                      metodo="PATCH"
                      corpo={{ verificado: !p.verificado }}
                      variante={p.verificado ? "neutro" : "aprovar"}
                    >
                      {p.verificado ? "Remover selo" : "✓ Aprovar"}
                    </BotaoAcao>
                    <BotaoAcao
                      caminho={`/api/admin/pontos/${p.id}`}
                      metodo="DELETE"
                      variante="perigo"
                      confirmar={`Excluir o ponto "${p.nome}"? Os ${p.totalDescartes} descartes registrados nele também serão apagados.`}
                    >
                      Excluir
                    </BotaoAcao>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pontos.length === 0 && <p className={styles.vazio}>Nenhum ponto encontrado com esses filtros.</p>}
      </div>

      <p className={styles.nota}>
        Pontos sugeridos pela comunidade entram sem o selo de verificação e aparecem no mapa com a
        etiqueta “Comunidade”. Aprovar aqui troca a etiqueta por “Verificado pela equipe”.
      </p>
    </>
  );
}
