import Link from "next/link";
import { api } from "@/lib/api";
import { CATEGORIAS, CHAVES_CATEGORIA } from "@/lib/categorias";
import { tempoRelativo } from "@/lib/geo";
import BotaoAcao from "@/components/admin/BotaoAcao";
import type { DescarteAdmin } from "@/lib/tipos";
import styles from "../admin.module.css";

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

type Props = { searchParams: Promise<{ categoria?: string; limite?: string }> };

export default async function AdminDescartesPage({ searchParams }: Props) {
  const { categoria = "", limite = "40" } = await searchParams;

  const parametros = new URLSearchParams({ limite });
  if (categoria) parametros.set("categoria", categoria);

  const { descartes, total } = await api<{ descartes: DescarteAdmin[]; total: number }>(
    `/api/admin/descartes?${parametros}`
  );
  const agora = new Date();

  return (
    <>
      <form className={styles.filtros} action="/admin/descartes">
        <label htmlFor="categoria" className="visually-hidden">
          Material
        </label>
        <select id="categoria" name="categoria" defaultValue={categoria}>
          <option value="">Todos os materiais</option>
          {CHAVES_CATEGORIA.map((c) => (
            <option key={c} value={c}>
              {CATEGORIAS[c].label}
            </option>
          ))}
        </select>
        <label htmlFor="limite" className="visually-hidden">
          Quantidade de registros
        </label>
        <select id="limite" name="limite" defaultValue={limite}>
          <option value="40">Últimos 40</option>
          <option value="100">Últimos 100</option>
          <option value="200">Últimos 200</option>
        </select>
        <button type="submit" className="btn btn-secundario btn-pequeno">
          Filtrar
        </button>
        <span className={styles.legenda}>{total} registros</span>
      </form>

      <div className={styles.tabelaWrap}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Quando</th>
              <th>Pessoa</th>
              <th>Material</th>
              <th>Ponto de coleta</th>
              <th className={styles.numerico}>Volumes</th>
              <th className={styles.numerico}>EcoPontos</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {descartes.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className={styles.principal}>{tempoRelativo(new Date(d.data), agora)}</span>
                  <span className={styles.secundario}>{dataHora.format(new Date(d.data))}</span>
                </td>
                <td>
                  <span className={styles.principal}>{d.usuario.nome}</span>
                  <span className={styles.secundario}>{d.usuario.email}</span>
                </td>
                <td>
                  <span className="selo">
                    <span className="ponto-cor" style={{ background: CATEGORIAS[d.categoria].cor }} aria-hidden="true" />
                    {CATEGORIAS[d.categoria].label}
                  </span>
                </td>
                <td>
                  <Link href={`/pontos/${d.ponto.id}`} className={styles.principal} target="_blank">
                    {d.ponto.nome}
                  </Link>
                  <span className={styles.secundario}>{d.ponto.bairro}</span>
                </td>
                <td className={styles.numerico}>{d.quantidade}</td>
                <td className={styles.numerico}>+{d.pontos}</td>
                <td>
                  <div className={styles.acoes}>
                    <BotaoAcao
                      caminho={`/api/admin/descartes/${d.id}`}
                      metodo="DELETE"
                      variante="perigo"
                      confirmar={`Anular este registro de ${d.usuario.nome}? Os ${d.pontos} EcoPontos serão removidos do ranking.`}
                    >
                      Anular
                    </BotaoAcao>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {descartes.length === 0 && <p className={styles.vazio}>Nenhum descarte registrado com esses filtros.</p>}
      </div>

      <p className={styles.nota}>
        A plataforma já limita 5 registros por pessoa a cada dia e recusa materiais que o ponto não
        aceita. Esta tela serve para anular registros suspeitos que passaram por essas regras.
      </p>
    </>
  );
}
