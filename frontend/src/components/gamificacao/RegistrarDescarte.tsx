"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { registrarDescarte, type ResultadoDescarte } from "@/actions/descartes";
import { CATEGORIAS, type CategoriaKey } from "@/lib/categorias";
import { PONTOS_POR_CATEGORIA, QUANTIDADE_MAXIMA } from "@/lib/gamificacao";
import styles from "./RegistrarDescarte.module.css";

type RegistrarDescarteProps = {
  pontoId: string;
  materiais: CategoriaKey[];
  autenticado: boolean;
  categoriaMissao: CategoriaKey;
  restantesHoje: number;
};

export default function RegistrarDescarte({
  pontoId,
  materiais,
  autenticado,
  categoriaMissao,
  restantesHoje,
}: RegistrarDescarteProps) {
  const [estado, acao, enviando] = useActionState<ResultadoDescarte, FormData>(registrarDescarte, {
    status: "ocioso",
  });
  const [categoria, setCategoria] = useState<CategoriaKey>(
    materiais.includes(categoriaMissao) ? categoriaMissao : materiais[0]
  );
  const [quantidade, setQuantidade] = useState(1);
  const dialogo = useRef<HTMLDialogElement>(null);

  const idSucesso = estado.status === "sucesso" ? estado.id : null;
  useEffect(() => {
    if (idSucesso) dialogo.current?.showModal();
  }, [idSucesso]);

  if (!autenticado) {
    return (
      <div className={styles.caixa}>
        <p className="eyebrow">Ganhe EcoPontos</p>
        <h2 className={styles.titulo}>Registre seu descarte</h2>
        <p className={styles.texto}>
          Entre na sua conta para registrar o que você trouxe a este ponto, cumprir a missão do dia e
          subir de nível.
        </p>
        <Link href={`/login?redirecionar=/pontos/${pontoId}`} className="btn btn-primario" style={{ width: "100%" }}>
          Entrar para registrar
        </Link>
      </div>
    );
  }

  const previa = PONTOS_POR_CATEGORIA[categoria] * quantidade;

  return (
    <div className={styles.caixa}>
      <p className="eyebrow">Ganhe EcoPontos</p>
      <h2 className={styles.titulo}>Registre seu descarte</h2>

      <form action={acao}>
        <input type="hidden" name="pontoId" value={pontoId} />

        <fieldset className="campo">
          <legend>O que você trouxe?</legend>
          <div className="chips" style={{ marginTop: 8 }}>
            {materiais.map((m) => (
              <label key={m} className="chip">
                <input
                  type="radio"
                  name="categoria"
                  value={m}
                  checked={categoria === m}
                  onChange={() => setCategoria(m)}
                />
                <span className="ponto-cor" style={{ background: CATEGORIAS[m].cor }} aria-hidden="true" />
                {CATEGORIAS[m].label}
                {m === categoriaMissao && <span className={styles.tagMissao}>missão</span>}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="campo">
          <label htmlFor="quantidade">Quantos volumes (sacolas ou caixas)?</label>
          <div className={styles.contador}>
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <input
              id="quantidade"
              name="quantidade"
              type="number"
              min={1}
              max={QUANTIDADE_MAXIMA}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.min(QUANTIDADE_MAXIMA, Math.max(1, Number(e.target.value) || 1)))}
            />
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.min(QUANTIDADE_MAXIMA, q + 1))}
              disabled={quantidade >= QUANTIDADE_MAXIMA}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
        </div>

        <p className={styles.dica}>
          <strong>Como preparar:</strong> {CATEGORIAS[categoria].dica}
        </p>

        {estado.status === "erro" && (
          <div className="erro" role="alert">
            {estado.mensagem}
          </div>
        )}

        <button type="submit" className="btn btn-primario" style={{ width: "100%" }} disabled={enviando || restantesHoje <= 0}>
          {enviando ? "Registrando..." : `Registrar descarte · +${previa} EcoPontos`}
        </button>
        <p className={styles.restantes}>
          {restantesHoje > 0
            ? `Você ainda pode registrar ${restantesHoje} ${restantesHoje === 1 ? "descarte" : "descartes"} hoje.`
            : "Limite diário atingido — volte amanhã!"}
        </p>
      </form>

      <dialog ref={dialogo} className={styles.dialogo} aria-labelledby="titulo-celebracao">
        {estado.status === "sucesso" && (
          <div className={styles.celebracao}>
            <div className={styles.medalha} aria-hidden="true">
              +{estado.pontosGanhos}
            </div>
            <h2 id="titulo-celebracao" className={styles.celebracaoTitulo}>
              {estado.subiuDeNivel ? `Você subiu para ${estado.nivelDepois}!` : "Descarte registrado!"}
            </h2>
            <p className={styles.texto}>
              Obrigado por destinar {CATEGORIAS[estado.categoria as CategoriaKey]?.label.toLowerCase()} do jeito certo.
            </p>

            <ul className={styles.extrato}>
              <li>
                <span>Descarte</span>
                <strong>+{estado.pontosGanhos - estado.bonus.reduce((s, b) => s + b.pontos, 0)}</strong>
              </li>
              {estado.bonus.map((b) => (
                <li key={b.rotulo} className={styles.bonus}>
                  <span>{b.rotulo}</span>
                  <strong>+{b.pontos}</strong>
                </li>
              ))}
            </ul>

            <div className={styles.progresso}>
              <div className={styles.progressoRotulo}>
                <span>
                  Nível <strong>{estado.nivelDepois}</strong>
                </span>
                <span>{estado.totalPontos} EcoPontos</span>
              </div>
              <div className={styles.trilho}>
                <div
                  className={styles.preenchimento}
                  style={{ width: `${Math.round(estado.progresso * 100)}%` }}
                />
              </div>
              {estado.proximoNivel && (
                <p className={styles.restantes}>
                  Faltam {estado.faltam} para {estado.proximoNivel}
                </p>
              )}
            </div>

            {estado.novasConquistas.length > 0 && (
              <div className={styles.conquistas}>
                <p className="eyebrow">Nova conquista desbloqueada</p>
                <ul>
                  {estado.novasConquistas.map((c, i) => (
                    <li key={c.titulo} style={{ animationDelay: `${0.4 + i * 0.15}s` }}>
                      <span className={styles.badge}>{c.simbolo}</span>
                      {c.titulo}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.acoesDialogo}>
              <Link href="/perfil" className="btn btn-secundario">
                Ver meu impacto
              </Link>
              <button type="button" className="btn btn-primario" onClick={() => dialogo.current?.close()} autoFocus>
                Continuar
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
