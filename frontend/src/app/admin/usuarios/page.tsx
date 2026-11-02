import { api } from "@/lib/api";
import { usuarioAtual } from "@/lib/auth";
import BotaoAcao from "@/components/admin/BotaoAcao";
import SeletorPapel from "@/components/admin/SeletorPapel";
import type { UsuarioAdmin } from "@/lib/tipos";
import styles from "../admin.module.css";

const dataCurta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const consulta = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";

  const [eu, { usuarios, total }] = await Promise.all([
    usuarioAtual(),
    api<{ usuarios: UsuarioAdmin[]; total: number }>(`/api/admin/usuarios${consulta}`),
  ]);

  return (
    <>
      <form className={styles.filtros} action="/admin/usuarios">
        <label htmlFor="q" className="visually-hidden">
          Buscar pessoa
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar por nome ou e-mail" />
        <button type="submit" className="btn btn-secundario btn-pequeno">
          Filtrar
        </button>
        <span className={styles.legenda}>{total} contas</span>
      </form>

      <div className={styles.tabelaWrap}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>Entrou em</th>
              <th className={styles.numerico}>EcoPontos</th>
              <th className={styles.numerico}>Descartes</th>
              <th className={styles.numerico}>Materiais</th>
              <th className={styles.numerico}>Pontos sugeridos</th>
              <th>Papel</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const euMesmo = u.id === eu?.id;
              return (
                <tr key={u.id}>
                  <td>
                    <span className={styles.principal}>
                      {u.nome}
                      {euMesmo && " (você)"}
                    </span>
                    <span className={styles.secundario}>{u.email}</span>
                  </td>
                  <td>{dataCurta.format(new Date(u.dataCadastro))}</td>
                  <td className={styles.numerico}>{u.ecopontos.toLocaleString("pt-BR")}</td>
                  <td className={styles.numerico}>{u.descartes}</td>
                  <td className={styles.numerico}>{u.materiais}</td>
                  <td className={styles.numerico}>{u.pontosSugeridos}</td>
                  <td>
                    <SeletorPapel usuarioId={u.id} papel={u.papel} euMesmo={euMesmo} />
                  </td>
                  <td>
                    <div className={styles.acoes}>
                      {!euMesmo && (
                        <BotaoAcao
                          caminho={`/api/admin/usuarios/${u.id}`}
                          metodo="DELETE"
                          variante="perigo"
                          confirmar={`Excluir a conta de ${u.nome}? Descartes, materiais e favoritos dessa pessoa serão apagados.`}
                        >
                          Excluir
                        </BotaoAcao>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {usuarios.length === 0 && <p className={styles.vazio}>Nenhuma conta encontrada para essa busca.</p>}
      </div>

      <p className={styles.nota}>
        Promover alguém a <strong>administrador</strong> libera esta área para a conta. Por segurança,
        ninguém pode rebaixar ou excluir a própria conta por aqui.
      </p>
    </>
  );
}
