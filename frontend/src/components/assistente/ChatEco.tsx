"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AcaoDireta, Bloco, Localizacao, RespostaAssistente } from "@/lib/assistente/tipos";
import Markdown, { textoParaFala } from "./Markdown";
import { useReconhecimentoDeFala, useSinteseDeVoz } from "./useVoz";
import styles from "./ChatEco.module.css";

type Mensagem = {
  id: string;
  autor: "usuario" | "eco";
  texto?: string;
  blocos?: Bloco[];
  /** Índices dos blocos interativos já usados (botões desativados) */
  usados?: number[];
};

type Estado = { mensagens: Mensagem[]; contexto: unknown };

const CHAVE_SESSAO = "reuse-eco-conversa-v1";
const novoId = () => Math.random().toString(36).slice(2, 10);

type ChatEcoProps = {
  modo: "flutuante" | "pagina";
  onFechar?: () => void;
  /** Chamado após navegar por um link ou comando (o widget flutuante se fecha no celular) */
  onNavegou?: () => void;
};

export default function ChatEco({ modo, onFechar, onNavegou }: ChatEcoProps) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ mensagens: [], contexto: null });
  const [carregado, setCarregado] = useState(false);
  const [entrada, setEntrada] = useState("");
  const [pensando, setPensando] = useState(false);
  const [motor, setMotor] = useState<"watson" | "local" | null>(null);
  const [lerRespostas, setLerRespostas] = useState(false);
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const contextoRef = useRef<unknown>(null);
  contextoRef.current = estado.contexto;

  const voz = useSinteseDeVoz();
  const fala = useReconhecimentoDeFala((texto) => enviarTexto(texto));

  // Conversa guardada na sessão do navegador: continua ao trocar de página
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_SESSAO);
      if (salvo) setEstado(JSON.parse(salvo));
      setLerRespostas(localStorage.getItem("reuse-eco-voz") === "1");
    } catch {}
    setCarregado(true);
    fetch("/api/assistente")
      .then((r) => r.json())
      .then((d) => setMotor(d.motor))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(estado));
    } catch {}
  }, [estado, carregado]);

  // Rola até a última mensagem depois que o navegador pinta os novos blocos
  useEffect(() => {
    const quadro = requestAnimationFrame(() => {
      lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: carregado ? "smooth" : "auto" });
    });
    return () => cancelAnimationFrame(quadro);
  }, [estado.mensagens, pensando, carregado]);

  const chamarApi = useCallback(
    async (corpo: { texto?: string; acao?: AcaoDireta; localizacao?: Localizacao | null }) => {
      setPensando(true);
      try {
        const resposta = await fetch("/api/assistente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...corpo,
            contexto: contextoRef.current,
            localizacao: corpo.localizacao ?? localizacao,
            // A página atual entra nos links de login que o Eco monta ("volte para onde estava")
            paginaAtual: window.location.pathname,
          }),
        });
        if (!resposta.ok) throw new Error(String(resposta.status));
        const dados = (await resposta.json()) as RespostaAssistente;

        if (dados.motor !== "acao") setMotor(dados.motor);
        setEstado((e) => ({
          contexto: dados.contexto,
          mensagens: dados.blocos.length ? [...e.mensagens, { id: novoId(), autor: "eco", blocos: dados.blocos }] : e.mensagens,
        }));

        if (lerRespostas) {
          const falavel = dados.blocos
            .map((b) => (b.tipo === "texto" ? b.texto : b.tipo === "confirmacao" ? b.texto : b.tipo === "celebracao" ? `${b.titulo} Mais ${b.pontos} EcoPontos.` : ""))
            .join(" ");
          voz.falar(textoParaFala(falavel));
        }

        if (dados.efeitos.atualizar) router.refresh();
        if (dados.efeitos.navegar) {
          router.push(dados.efeitos.navegar);
          onNavegou?.();
        }
      } catch {
        setEstado((e) => ({
          ...e,
          mensagens: [...e.mensagens, { id: novoId(), autor: "eco", blocos: [{ tipo: "texto", texto: "⚠️ Não consegui responder agora. Verifique sua conexão e tente de novo." }] }],
        }));
      } finally {
        setPensando(false);
      }
    },
    [localizacao, lerRespostas, router, voz, onNavegou]
  );

  // Boas-vindas vindas do Watson na primeira abertura (a ref evita chamada dupla no modo estrito)
  const boasVindasPedidas = useRef(false);
  useEffect(() => {
    if (!carregado || boasVindasPedidas.current || estado.mensagens.length > 0) return;
    boasVindasPedidas.current = true;
    chamarApi({ texto: "" });
  }, [carregado]); // eslint-disable-line react-hooks/exhaustive-deps

  function enviarTexto(texto: string, rotulo?: string) {
    const limpo = texto.trim();
    if (!limpo || pensando) return;
    setEstado((e) => ({ ...e, mensagens: [...e.mensagens, { id: novoId(), autor: "usuario", texto: rotulo ?? limpo }] }));
    setEntrada("");
    chamarApi({ texto: limpo });
  }

  function marcarUsado(mensagemId: string, indice: number) {
    setEstado((e) => ({
      ...e,
      mensagens: e.mensagens.map((m) => (m.id === mensagemId ? { ...m, usados: [...(m.usados ?? []), indice] } : m)),
    }));
  }

  function executar(mensagemId: string, indice: number, acao: AcaoDireta, rotulo: string, loc?: Localizacao) {
    if (pensando) return;
    marcarUsado(mensagemId, indice);
    setEstado((e) => ({ ...e, mensagens: [...e.mensagens, { id: novoId(), autor: "usuario", texto: rotulo }] }));
    chamarApi({ acao, localizacao: loc });
  }

  function pedirLocalizacao(mensagemId: string, indice: number, acao: AcaoDireta) {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocalizacao(loc);
        executar(mensagemId, indice, acao, "📍 Usar minha localização", loc);
      },
      () => {
        marcarUsado(mensagemId, indice);
        setEstado((e) => ({
          ...e,
          mensagens: [...e.mensagens, { id: novoId(), autor: "eco", blocos: [{ tipo: "texto", texto: "Não consegui acessar sua localização. Libere a permissão no navegador (ícone de cadeado ao lado do endereço) ou busque pelo seu bairro no [mapa](/pontos)." }] }],
        }));
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  function recomecar() {
    voz.calar();
    setEstado({ mensagens: [], contexto: null });
    contextoRef.current = null;
    setTimeout(() => chamarApi({ texto: "" }), 0);
  }

  function alternarVoz() {
    const novo = !lerRespostas;
    setLerRespostas(novo);
    if (!novo) voz.calar();
    try {
      localStorage.setItem("reuse-eco-voz", novo ? "1" : "0");
    } catch {}
  }

  const ultimaMensagem = estado.mensagens[estado.mensagens.length - 1];

  return (
    <section className={`${styles.chat} ${modo === "pagina" ? styles.pagina : styles.flutuante}`} aria-label="Assistente virtual Eco">
      <header className={styles.topo}>
        <div className={styles.avatar} aria-hidden="true">
          ♻
        </div>
        <div className={styles.identidade}>
          <strong>Eco</strong>
          <span className={styles.selo} title={motor === "local" ? "Credenciais do IBM Watson não configuradas: usando o motor local com a mesma skill" : "Respostas processadas pelo IBM watsonx Assistant"}>
            <span className={styles.statusPonto} data-motor={motor ?? "carregando"} />
            {motor === "local" ? "Assistente ReUse! · modo local" : "Assistente ReUse! · IBM Watson"}
          </span>
        </div>
        <div className={styles.acoesTopo}>
          {voz.suportado && (
            <button type="button" onClick={alternarVoz} aria-pressed={lerRespostas} title={lerRespostas ? "Parar de ler respostas" : "Ler respostas em voz alta"}>
              {lerRespostas ? "🔊" : "🔈"}
              <span className="visually-hidden">Leitura em voz alta</span>
            </button>
          )}
          <button type="button" onClick={recomecar} title="Recomeçar conversa">
            ↺<span className="visually-hidden">Recomeçar conversa</span>
          </button>
          {onFechar && (
            <button type="button" onClick={onFechar} title="Fechar">
              ✕<span className="visually-hidden">Fechar assistente</span>
            </button>
          )}
        </div>
      </header>

      <div ref={lista} className={styles.mensagens} role="log" aria-live="polite">
        {estado.mensagens.map((m) =>
          m.autor === "usuario" ? (
            <div key={m.id} className={styles.balaoUsuario}>
              {m.texto}
            </div>
          ) : (
            <div key={m.id} className={styles.respostaEco}>
              {m.blocos?.map((b, i) => {
                // Sugestões antigas somem; botões de ação usados ficam visíveis, porém desativados
                const usado = m.usados?.includes(i) || (m !== ultimaMensagem && b.tipo === "opcoes");
                return (
                  <BlocoEco
                    key={i}
                    bloco={b}
                    usado={Boolean(usado)}
                    ocupado={pensando}
                    onTexto={(t, rotulo) => enviarTexto(t, rotulo)}
                    onAcao={(acao, rotulo) => executar(m.id, i, acao, rotulo)}
                    onCancelar={() => {
                      marcarUsado(m.id, i);
                      setEstado((e) => ({ ...e, mensagens: [...e.mensagens, { id: novoId(), autor: "eco", blocos: [{ tipo: "texto", texto: "Tudo bem, não alterei nada. 👍" }] }] }));
                    }}
                    onLocalizacao={(acao) => pedirLocalizacao(m.id, i, acao)}
                    onLink={onNavegou}
                  />
                );
              })}
            </div>
          )
        )}
        {pensando && (
          <div className={styles.digitando} aria-label="Eco está digitando">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <form
        className={styles.rodape}
        onSubmit={(e) => {
          e.preventDefault();
          enviarTexto(entrada);
        }}
      >
        {fala.erro && <p className={styles.erroVoz}>{fala.erro}</p>}
        <div className={styles.campo} data-ouvindo={fala.ouvindo}>
          <input
            ref={campo}
            value={fala.ouvindo ? fala.parcial : entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                enviarTexto(entrada);
              }
            }}
            placeholder={fala.ouvindo ? "Ouvindo… pode falar" : "Digite ou fale com o Eco"}
            aria-label="Mensagem para o assistente"
            maxLength={500}
            disabled={fala.ouvindo}
          />
          {fala.suportado && (
            <button
              type="button"
              className={styles.microfone}
              onClick={fala.ouvindo ? fala.parar : fala.ouvir}
              aria-pressed={fala.ouvindo}
              title={fala.ouvindo ? "Parar de ouvir" : "Falar com o Eco"}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" />
              </svg>
              <span className="visually-hidden">{fala.ouvindo ? "Parar de ouvir" : "Falar"}</span>
            </button>
          )}
          <button type="submit" className={styles.enviar} disabled={!entrada.trim() || pensando} title="Enviar">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12l-11.61 1.87z" />
            </svg>
            <span className="visually-hidden">Enviar</span>
          </button>
        </div>
      </form>
    </section>
  );
}

// ------------------------------------------------------------------ blocos de resposta

type BlocoEcoProps = {
  bloco: Bloco;
  usado: boolean;
  ocupado: boolean;
  onTexto: (texto: string, rotulo: string) => void;
  onAcao: (acao: AcaoDireta, rotulo: string) => void;
  onCancelar: () => void;
  onLocalizacao: (acao: AcaoDireta) => void;
  onLink?: () => void;
};

function BlocoEco({ bloco, usado, ocupado, onTexto, onAcao, onCancelar, onLocalizacao, onLink }: BlocoEcoProps) {
  const desativado = usado || ocupado;

  switch (bloco.tipo) {
    case "texto":
      return (
        <div className={styles.balaoEco}>
          <Markdown texto={bloco.texto} onLink={onLink} />
        </div>
      );

    case "opcoes":
      if (usado) return null;
      return (
        <div className={styles.opcoes} role="group" aria-label={bloco.titulo ?? "Sugestões"}>
          {bloco.opcoes.map((o) => (
            <button key={o.rotulo} type="button" className={styles.chip} disabled={ocupado} onClick={() => onTexto(o.texto, o.rotulo)}>
              {o.rotulo}
            </button>
          ))}
        </div>
      );

    case "botoes":
      return (
        <div className={styles.botoes}>
          {bloco.botoes.map((b) => (
            <button key={b.rotulo} type="button" className={styles.botaoAcao} disabled={desativado} onClick={() => onAcao(b.acao, b.rotulo)}>
              {b.rotulo}
            </button>
          ))}
        </div>
      );

    case "confirmacao":
      return (
        <div className={styles.confirmacao}>
          <Markdown texto={bloco.texto} onLink={onLink} />
          <div className={styles.confirmacaoBotoes}>
            <button type="button" className="btn btn-primario btn-pequeno" disabled={desativado} onClick={() => onAcao(bloco.confirmar.acao, `✔ ${bloco.confirmar.rotulo}`)}>
              {bloco.confirmar.rotulo}
            </button>
            <button type="button" className="btn btn-secundario btn-pequeno" disabled={desativado} onClick={onCancelar}>
              {bloco.cancelarRotulo ?? "Cancelar"}
            </button>
          </div>
        </div>
      );

    case "cartoes":
      return (
        <ul className={styles.cartoes}>
          {bloco.cartoes.map((c) => (
            <li key={c.titulo + (c.href ?? "")} className={styles.cartao}>
              <strong>{c.titulo}</strong>
              {c.subtitulo && <span className={styles.cartaoSub}>{c.subtitulo}</span>}
              {c.detalhe && <span className={styles.cartaoDetalhe}>{c.detalhe}</span>}
              <div className={styles.cartaoRodape}>
                {c.cores && (
                  <span className={styles.cores} aria-hidden="true">
                    {c.cores.map((cor, i) => (
                      <span key={i} className="ponto-cor" style={{ background: cor }} />
                    ))}
                  </span>
                )}
                {c.linkExterno && (
                  <a href={c.linkExterno.href} target="_blank" rel="noopener noreferrer">
                    {c.linkExterno.rotulo}
                  </a>
                )}
                {c.href && (
                  <Link href={c.href} onClick={onLink}>
                    {c.rotuloLink ?? "Abrir"} →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      );

    case "links":
      return (
        <div className={styles.links}>
          {bloco.links.map((l) => (
            <Link key={l.href} href={l.href} onClick={onLink}>
              {l.rotulo} →
            </Link>
          ))}
        </div>
      );

    case "pedirLocalizacao":
      return (
        <div className={styles.localizacao}>
          <span>{bloco.texto}</span>
          <button type="button" className={styles.botaoAcao} disabled={desativado} onClick={() => onLocalizacao(bloco.acao)}>
            📍 Usar minha localização
          </button>
        </div>
      );

    case "progresso":
      return (
        <div className={styles.progresso}>
          <div className={styles.progressoTopo}>
            <strong>{bloco.titulo}</strong>
            <span>{Math.round(bloco.valor * 100)}%</span>
          </div>
          <div className={styles.trilho}>
            <div className={styles.preenchimento} style={{ width: `${Math.round(bloco.valor * 100)}%` }} />
          </div>
          <span className={styles.legenda}>{bloco.legenda}</span>
        </div>
      );

    case "celebracao":
      return (
        <div className={styles.celebracao}>
          <div className={styles.medalha} aria-hidden="true">
            +{bloco.pontos}
          </div>
          <div>
            <strong>{bloco.titulo}</strong>
            <ul>
              {bloco.extrato.map((e) => (
                <li key={e.rotulo}>
                  {e.rotulo} <b>+{e.pontos}</b>
                </li>
              ))}
            </ul>
            {bloco.conquistas.length > 0 && (
              <p className={styles.conquistas}>🏅 Nova conquista: {bloco.conquistas.join(", ")}</p>
            )}
          </div>
        </div>
      );
  }
}
