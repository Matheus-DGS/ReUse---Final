import Link from "next/link";
import { api } from "@/lib/api";
import { CATEGORIAS, CHAVES_CATEGORIA } from "@/lib/categorias";
import BotaoAcao from "@/components/admin/BotaoAcao";
import type { ItemAdmin } from "@/lib/tipos";
import styles from "../admin.module.css";

const dataCurta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

type Props = { searchParams: Promise<{ q?: string; categoria?: string }> };

export default async function AdminMateriaisPage({ searchParams }: Props) {
  const { q = "", categoria = "" } = await searchParams;

  const parametros = new URLSearchParams();
  if (q.trim()) parametros.set("q", q.trim());
  if (categoria) parametros.set("categoria", categoria);
  const consulta = parametros.toString();

  const { itens, total } = await api<{ itens: ItemAdmin[]; total: number }>(
    `/api/admin/itens${consulta ? `?${consulta}` : ""}`
  );

  return (
    <>
      <form className={styles.filtros} action="/admin/materiais">
        <label htmlFor="q" className="visually-hidden">
          Buscar material
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar pelo nome do material" />
        <label htmlFor="categoria" className="visually-hidden">
          Categoria
        </label>
        <select id="categoria" name="categoria" defaultValue={categoria}>
          <option value="">Todas as categorias</option>
          {CHAVES_CATEGORIA.map((c) => (
            <option key={c} value={c}>
              {CATEGORIAS[c].label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-secundario btn-pequeno">
          Filtrar
        </button>
        <span className={styles.legenda}>{total} materiais</span>
      </form>

      <div className={styles.tabelaWrap}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Categoria</th>
              <th>Cadastrado por</th>
              <th className={styles.numerico}>Favoritos</th>
              <th className={styles.numerico}>Fotos</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/materiais/${item.id}`} className={styles.principal} target="_blank">
                    {item.nomeItem}
                  </Link>
                  <span className={styles.secundario}>
                    {item.descricao.length > 110 ? `${item.descricao.slice(0, 110)}…` : item.descricao}
                  </span>
                </td>
                <td>
                  <span className="selo">
                    <span className="ponto-cor" style={{ background: CATEGORIAS[item.categoria].cor }} aria-hidden="true" />
                    {CATEGORIAS[item.categoria].label}
                  </span>
                </td>
                <td>
                  <span className={styles.principal}>{item.usuario.nome}</span>
                  <span className={styles.secundario}>{item.usuario.email}</span>
                  <span className={styles.secundario}>em {dataCurta.format(new Date(item.dataPublicacao))}</span>
                </td>
                <td className={styles.numerico}>{item.favoritos}</td>
                <td className={styles.numerico}>{item.fotos}</td>
                <td>
                  <div className={styles.acoes}>
                    <BotaoAcao
                      caminho={`/api/admin/itens/${item.id}`}
                      metodo="DELETE"
                      variante="perigo"
                      confirmar={`Remover "${item.nomeItem}" do catálogo? Os favoritos ligados a ele também serão apagados.`}
                    >
                      Remover
                    </BotaoAcao>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {itens.length === 0 && <p className={styles.vazio}>Nenhum material encontrado com esses filtros.</p>}
      </div>

      <p className={styles.nota}>
        O catálogo é colaborativo: qualquer pessoa autenticada pode cadastrar um material e ganha
        EcoPontos por isso. A curadoria acontece aqui.
      </p>
    </>
  );
}
