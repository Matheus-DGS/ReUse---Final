"use client";

import { useActionState } from "react";
import { cadastrarMaterial } from "@/actions/materiais";
import type { EstadoFormulario } from "@/actions/pontos";
import { CATEGORIAS, CHAVES_CATEGORIA } from "@/lib/categorias";
import { PONTOS_MATERIAL_CATALOGO } from "@/lib/gamificacao";

export default function FormularioMaterial() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(cadastrarMaterial, {});
  const campos = estado.campos ?? {};

  return (
    <form action={acao}>
      {estado.erro && (
        <div className="erro" role="alert">
          {estado.erro}
        </div>
      )}

      <div className="campo">
        <label htmlFor="nomeItem">Nome do material</label>
        <input id="nomeItem" name="nomeItem" required minLength={3} defaultValue={campos.nomeItem} placeholder="Ex.: Caixa de leite longa vida" />
      </div>

      <fieldset className="campo">
        <legend>Categoria</legend>
        <div className="chips" style={{ marginTop: 8 }}>
          {CHAVES_CATEGORIA.map((c) => (
            <label key={c} className="chip">
              <input type="radio" name="categoria" value={c} required defaultChecked={campos.categoria === c} />
              <span className="ponto-cor" style={{ background: CATEGORIAS[c].cor }} aria-hidden="true" />
              {CATEGORIAS[c].label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="campo">
        <label htmlFor="descricao">Descrição e forma de descarte</label>
        <textarea
          id="descricao"
          name="descricao"
          required
          minLength={10}
          defaultValue={campos.descricao}
          placeholder="Explique o que é o material e como prepará-lo para a reciclagem."
        />
      </div>

      <div className="campo">
        <label htmlFor="urlFoto">Link de uma foto (opcional)</label>
        <input id="urlFoto" name="urlFoto" type="url" defaultValue={campos.urlFoto} placeholder="https://..." />
        <p className="ajuda">Sem foto, o card usa a cor da categoria.</p>
      </div>

      <button type="submit" className="btn btn-primario" style={{ width: "100%" }} disabled={enviando}>
        {enviando ? "Salvando..." : `Cadastrar material · +${PONTOS_MATERIAL_CATALOGO} EcoPontos`}
      </button>
    </form>
  );
}
