"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { sugerirPonto, type EstadoFormulario } from "@/actions/pontos";
import { CATEGORIAS, CHAVES_CATEGORIA } from "@/lib/categorias";
import { TIPOS_PONTO } from "@/lib/pontos";
import { PONTOS_SUGESTAO_PONTO } from "@/lib/gamificacao";
import styles from "./FormularioPonto.module.css";

const SeletorLocalizacao = dynamic(() => import("./SeletorLocalizacao"), {
  ssr: false,
  loading: () => <div className="esqueleto" style={{ height: "100%" }} />,
});

export default function FormularioPonto() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(sugerirPonto, {});
  const [posicao, setPosicao] = useState<[number, number] | null>(null);
  const [localizando, setLocalizando] = useState(false);
  // Controlado: o React reinicia o <form> após a action e o <select> perderia a escolha
  const [tipo, setTipo] = useState("");
  const campos = estado.campos ?? {};

  function usarMinhaLocalizacao() {
    if (!("geolocation" in navigator)) return;
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosicao([Number(pos.coords.latitude.toFixed(6)), Number(pos.coords.longitude.toFixed(6))]);
        setLocalizando(false);
      },
      () => setLocalizando(false),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  return (
    <form action={acao} className={styles.form}>
      <div className={styles.colunas}>
        <div>
          {estado.erro && (
            <div className="erro" role="alert">
              {estado.erro}
            </div>
          )}

          <div className="campo">
            <label htmlFor="nome">Nome do ponto</label>
            <input id="nome" name="nome" required minLength={3} defaultValue={campos.nome} placeholder="Ex.: PEV do Mercado Central" />
          </div>

          <div className={styles.duplo}>
            <div className="campo">
              <label htmlFor="tipo">Tipo</label>
              <select id="tipo" name="tipo" required value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="" disabled>
                  Selecione
                </option>
                {Object.entries(TIPOS_PONTO).map(([chave, t]) => (
                  <option key={chave} value={chave}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="horario">Horário de funcionamento</label>
              <input id="horario" name="horario" required defaultValue={campos.horario} placeholder="Seg a sáb, 8h às 18h" />
            </div>
          </div>

          <fieldset className="campo">
            <legend>Materiais aceitos</legend>
            <div className="chips" style={{ marginTop: 8 }}>
              {CHAVES_CATEGORIA.map((c) => (
                <label key={c} className="chip">
                  <input
                    type="checkbox"
                    name="materiais"
                    value={c}
                    defaultChecked={campos.materiais?.split(",").includes(c)}
                  />
                  <span className="ponto-cor" style={{ background: CATEGORIAS[c].cor }} aria-hidden="true" />
                  {CATEGORIAS[c].label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="campo">
            <label htmlFor="endereco">Endereço</label>
            <input id="endereco" name="endereco" required defaultValue={campos.endereco} placeholder="Rua, número" />
          </div>

          <div className={styles.duplo}>
            <div className="campo">
              <label htmlFor="bairro">Bairro</label>
              <input id="bairro" name="bairro" required defaultValue={campos.bairro} />
            </div>
            <div className="campo">
              <label htmlFor="cidade">Cidade</label>
              <input id="cidade" name="cidade" defaultValue={campos.cidade ?? "São Paulo"} />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="telefone">Telefone (opcional)</label>
            <input id="telefone" name="telefone" type="tel" defaultValue={campos.telefone} placeholder="(11) 0000-0000" />
          </div>

          <div className="campo">
            <label htmlFor="descricao">Observações (opcional)</label>
            <textarea
              id="descricao"
              name="descricao"
              defaultValue={campos.descricao}
              placeholder="Ex.: contêineres ficam ao lado do estacionamento; não recebe vidro quebrado."
            />
          </div>
        </div>

        <div className={styles.colunaMapa}>
          <div className={styles.mapaTopo}>
            <div>
              <p className={styles.mapaTitulo}>Localização no mapa</p>
              <p className="ajuda">Clique no mapa para marcar o ponto. Você pode arrastar o marcador para ajustar.</p>
            </div>
            <button type="button" className="btn btn-secundario btn-pequeno" onClick={usarMinhaLocalizacao} disabled={localizando}>
              {localizando ? "Localizando..." : "Estou no local"}
            </button>
          </div>
          <div className={styles.mapa} data-marcado={Boolean(posicao)}>
            <SeletorLocalizacao posicao={posicao} onEscolher={setPosicao} />
          </div>
          <p className={styles.coordenadas} aria-live="polite">
            {posicao ? `Marcado em ${posicao[0]}, ${posicao[1]}` : "Nenhuma posição marcada ainda."}
          </p>
          <input type="hidden" name="latitude" value={posicao?.[0] ?? ""} />
          <input type="hidden" name="longitude" value={posicao?.[1] ?? ""} />

          <div className={styles.recompensa}>
            <span aria-hidden="true">✚</span>
            Sugerir um ponto rende <strong>+{PONTOS_SUGESTAO_PONTO} EcoPontos</strong> e a conquista{" "}
            <strong>Mapeador</strong>.
          </div>

          <button type="submit" className="btn btn-primario" style={{ width: "100%" }} disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar sugestão"}
          </button>
        </div>
      </div>
    </form>
  );
}
