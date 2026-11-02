"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIAS, CHAVES_CATEGORIA, ehCategoria, type CategoriaKey } from "@/lib/categorias";
import { TIPOS_PONTO, ehTipoPonto, type TipoPontoKey } from "@/lib/pontos";
import { distanciaKm, formatarDistancia } from "@/lib/geo";
import MapaPontosLazy from "./MapaPontosLazy";
import type { PontoResumo } from "./tipos";
import styles from "./ExploradorPontos.module.css";

type EstadoLocalizacao = "inativo" | "buscando" | "ativo" | "negado" | "indisponivel";

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function ExploradorPontos({ pontos }: { pontos: PontoResumo[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const materialUrl = searchParams.get("material");
  const tipoUrl = searchParams.get("tipo");

  const [material, setMaterial] = useState<CategoriaKey | null>(ehCategoria(materialUrl) ? materialUrl : null);
  const [tipo, setTipo] = useState<TipoPontoKey | "">(ehTipoPonto(tipoUrl) ? tipoUrl : "");
  const [busca, setBusca] = useState("");
  const buscaAdiada = useDeferredValue(busca);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [localizacao, setLocalizacao] = useState<{ latitude: number; longitude: number } | null>(null);
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalizacao>("inativo");
  const [visao, setVisao] = useState<"lista" | "mapa">("lista");
  const refsCartoes = useRef(new Map<string, HTMLLIElement>());

  // Mantém os filtros na URL: o link pode ser compartilhado e o "voltar" do navegador funciona
  useEffect(() => {
    const params = new URLSearchParams();
    if (material) params.set("material", material);
    if (tipo) params.set("tipo", tipo);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [material, tipo, pathname, router]);

  const resultados = useMemo(() => {
    const termo = normalizar(buscaAdiada.trim());
    const filtrados = pontos
      .filter((p) => !material || p.materiais.includes(material))
      .filter((p) => !tipo || p.tipo === tipo)
      .filter((p) => !termo || normalizar(`${p.nome} ${p.bairro} ${p.endereco}`).includes(termo))
      .map((p) => ({ ...p, distancia: localizacao ? distanciaKm(localizacao, p) : null }));

    // Com localização: mais perto primeiro. Sem: verificados e mais movimentados primeiro.
    return filtrados.sort((a, b) =>
      a.distancia !== null && b.distancia !== null
        ? a.distancia - b.distancia
        : Number(b.verificado) - Number(a.verificado) ||
          b.totalDescartes - a.totalDescartes ||
          a.nome.localeCompare(b.nome)
    );
  }, [pontos, material, tipo, buscaAdiada, localizacao]);

  function usarLocalizacao() {
    if (!("geolocation" in navigator)) {
      setEstadoLocal("indisponivel");
      return;
    }
    setEstadoLocal("buscando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalizacao({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setEstadoLocal("ativo");
        setSelecionadoId(null);
      },
      (erro) => setEstadoLocal(erro.code === erro.PERMISSION_DENIED ? "negado" : "indisponivel"),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  function selecionarNoMapa(id: string) {
    setSelecionadoId(id);
    refsCartoes.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function limparFiltros() {
    setMaterial(null);
    setTipo("");
    setBusca("");
  }

  const maisProximo = localizacao ? resultados[0] : null;
  const temFiltro = Boolean(material || tipo || busca);

  return (
    <section className={styles.explorador} aria-label="Explorar pontos de coleta">
      <div className={styles.barra}>
        <div className={styles.linhaBusca}>
          <label className={styles.busca}>
            <span className="visually-hidden">Buscar por nome, bairro ou endereço</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M10.5 3a7.5 7.5 0 0 1 5.96 12.06l4.24 4.24-1.4 1.4-4.24-4.24A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
                fill="currentColor"
              />
            </svg>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, bairro ou endereço"
            />
          </label>

          <label className={styles.selectTipo}>
            <span className="visually-hidden">Tipo de ponto</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoPontoKey | "")}>
              <option value="">Todos os tipos</option>
              {Object.entries(TIPOS_PONTO).map(([chave, t]) => (
                <option key={chave} value={chave}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={usarLocalizacao}
            className={`btn ${estadoLocal === "ativo" ? "btn-secundario" : "btn-primario"} ${styles.botaoLocal}`}
            disabled={estadoLocal === "buscando"}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M12 2a1 1 0 0 1 1 1v1.06A8 8 0 0 1 19.94 11H21a1 1 0 1 1 0 2h-1.06A8 8 0 0 1 13 19.94V21a1 1 0 1 1-2 0v-1.06A8 8 0 0 1 4.06 13H3a1 1 0 1 1 0-2h1.06A8 8 0 0 1 11 4.06V3a1 1 0 0 1 1-1Zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
                fill="currentColor"
              />
            </svg>
            {estadoLocal === "buscando"
              ? "Localizando..."
              : estadoLocal === "ativo"
                ? "Atualizar localização"
                : "Perto de mim"}
          </button>
        </div>

        <div className={`chips ${styles.chips}`} role="group" aria-label="Filtrar por material aceito">
          <button type="button" className="chip" aria-pressed={!material} onClick={() => setMaterial(null)}>
            Todos os materiais
          </button>
          {CHAVES_CATEGORIA.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={material === c}
              onClick={() => setMaterial(material === c ? null : c)}
            >
              <span className="ponto-cor" style={{ background: CATEGORIAS[c].cor }} aria-hidden="true" />
              {CATEGORIAS[c].label}
            </button>
          ))}
        </div>

        {(estadoLocal === "negado" || estadoLocal === "indisponivel") && (
          <p className={styles.avisoLocal} role="alert">
            {estadoLocal === "negado"
              ? "Permissão de localização negada. Libere o acesso no navegador ou busque pelo seu bairro."
              : "Não foi possível obter sua localização agora. Tente buscar pelo seu bairro."}
          </p>
        )}
      </div>

      <div className={styles.resumo} aria-live="polite">
        <p>
          <strong>{resultados.length}</strong> {resultados.length === 1 ? "ponto encontrado" : "pontos encontrados"}
          {material && (
            <>
              {" "}
              que recebem <strong>{CATEGORIAS[material].label.toLowerCase()}</strong>
            </>
          )}
          {localizacao && " · ordenados pela distância"}
        </p>
        {temFiltro && (
          <button type="button" className={styles.limpar} onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {maisProximo && maisProximo.distancia !== null && (
        <div className={styles.destaqueProximo}>
          <span className={styles.destaqueIcone} aria-hidden="true">
            ⌖
          </span>
          <p>
            O ponto mais próximo{material ? ` para ${CATEGORIAS[material].label.toLowerCase()}` : ""} é{" "}
            <strong>{maisProximo.nome}</strong>, a {formatarDistancia(maisProximo.distancia)} de você.
          </p>
          <Link href={`/pontos/${maisProximo.id}`} className="btn btn-primario btn-pequeno">
            Ir para o ponto
          </Link>
        </div>
      )}

      <div className={styles.alternarVisao} role="tablist" aria-label="Modo de visualização">
        <button type="button" role="tab" aria-selected={visao === "lista"} onClick={() => setVisao("lista")}>
          Lista
        </button>
        <button type="button" role="tab" aria-selected={visao === "mapa"} onClick={() => setVisao("mapa")}>
          Mapa
        </button>
      </div>

      <div className={styles.grade} data-visao={visao}>
        <ul className={styles.lista}>
          {resultados.map((p, i) => (
            <li
              key={p.id}
              ref={(el) => {
                if (el) refsCartoes.current.set(p.id, el);
                else refsCartoes.current.delete(p.id);
              }}
              className={`anima-card ${styles.cartao}`}
              style={{ "--ordem": Math.min(i, 8) } as React.CSSProperties}
              data-selecionado={p.id === selecionadoId}
            >
              <button
                type="button"
                className={styles.cartaoSelecionar}
                onClick={() => setSelecionadoId(p.id)}
                aria-label={`Mostrar ${p.nome} no mapa`}
              />
              <div className={styles.cartaoTopo}>
                <span className="selo">{TIPOS_PONTO[p.tipo].label}</span>
                {p.verificado ? (
                  <span className="selo selo-verificado">✓ Verificado</span>
                ) : (
                  <span className="selo selo-comunidade">Comunidade</span>
                )}
                {p.distancia !== null && <span className={styles.distancia}>{formatarDistancia(p.distancia)}</span>}
              </div>
              <h3 className={styles.cartaoTitulo}>{p.nome}</h3>
              <p className={styles.cartaoEndereco}>
                {p.endereco} · {p.bairro}
              </p>
              <p className={styles.cartaoHorario}>{p.horario}</p>
              <div className={styles.cartaoRodape}>
                <div className={styles.cores} aria-label={`Aceita: ${p.materiais.map((m) => CATEGORIAS[m].label).join(", ")}`}>
                  {p.materiais.map((m) => (
                    <span
                      key={m}
                      className="ponto-cor"
                      style={{ background: CATEGORIAS[m].cor }}
                      title={CATEGORIAS[m].label}
                    />
                  ))}
                </div>
                <span className={styles.contador}>
                  {p.totalDescartes} {p.totalDescartes === 1 ? "descarte" : "descartes"}
                </span>
                <Link href={`/pontos/${p.id}`} className={styles.cartaoLink}>
                  Detalhes →
                </Link>
              </div>
            </li>
          ))}

          {resultados.length === 0 && (
            <li className={styles.vazio}>
              <p>Nenhum ponto encontrado com esses filtros.</p>
              <button type="button" className="btn btn-secundario btn-pequeno" onClick={limparFiltros}>
                Limpar filtros
              </button>
            </li>
          )}
        </ul>

        <div className={styles.mapa}>
          <MapaPontosLazy
            pontos={resultados}
            selecionadoId={selecionadoId}
            onSelecionar={selecionarNoMapa}
            localizacao={localizacao}
          />
        </div>
      </div>
    </section>
  );
}
