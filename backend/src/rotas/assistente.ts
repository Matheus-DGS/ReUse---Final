// /api/assistente — assistente virtual Eco (IBM watsonx Assistant + motor local de fallback).
//
//   POST { texto, contexto, localizacao, paginaAtual }   → conversa + execução das tarefas
//   POST { acao: { nome, params }, localizacao }         → ação disparada por um botão do chat
//   GET                                                   → qual motor está ativo

import { Router } from "express";
import { rota } from "@/lib/http";
import { conversarComWatson, watsonConfigurado } from "@/assistente/watson";
import { conversarLocalmente } from "@/assistente/motor-local";
import { VARIAVEIS_POR_ACAO, executarAcaoDireta, executarAcaoDoWatson } from "@/assistente/acoes";
import type { Generic, SaidaMotor } from "@/assistente/motor";
import type { Bloco, Efeitos, Localizacao, RequisicaoAssistente, RespostaAssistente } from "@/assistente/tipos";

const TAMANHO_MAXIMO = 500;

export const rotasAssistente = Router();

rotasAssistente.get("/", (_req, res) => {
  res.json({ motor: watsonConfigurado() ? "watson" : "local" });
});

rotasAssistente.post(
  "/",
  rota(async (req, res) => {
    const corpo = (req.body ?? {}) as RequisicaoAssistente & { paginaAtual?: string };
    const usuario = req.usuario ? { id: req.usuario.id, nome: req.usuario.nome } : null;
    const localizacao = localizacaoValida(corpo.localizacao);
    const exec = { usuario, localizacao, paginaAtual: caminhoValido(corpo.paginaAtual ?? req.headers.referer) };

    if (corpo.acao?.nome) {
      const resultado = await executarAcaoDireta(corpo.acao, exec);
      const resposta: RespostaAssistente = {
        blocos: resultado.blocos,
        efeitos: resultado.efeitos ?? {},
        contexto: corpo.contexto ?? null,
        motor: "acao",
      };
      res.json(resposta);
      return;
    }

    const texto = String(corpo.texto ?? "").slice(0, TAMANHO_MAXIMO);
    const saida = await conversar(texto, corpo.contexto, usuario?.id ?? null);

    const blocos: Bloco[] = [];
    const efeitos: Efeitos = {};
    let contexto = saida.contexto;

    for (const item of saida.generic) {
      if (item.response_type === "user_defined") {
        const dados = (item as { user_defined: Record<string, unknown> }).user_defined;
        const resultado = await executarAcaoDoWatson(dados, exec);
        blocos.push(...resultado.blocos);
        Object.assign(efeitos, resultado.efeitos);
        contexto = limparVariaveis(contexto, VARIAVEIS_POR_ACAO[String(dados.acao)] ?? []);
      } else {
        const bloco = paraBloco(item);
        if (bloco) blocos.push(bloco);
      }
    }

    const resposta: RespostaAssistente = { blocos, efeitos, contexto, motor: saida.motor, intencao: saida.intencao };
    res.json(resposta);
  })
);

async function conversar(texto: string, contexto: unknown, usuarioId: string | null): Promise<SaidaMotor> {
  if (watsonConfigurado()) {
    try {
      return await conversarComWatson(texto, contexto, usuarioId);
    } catch (e) {
      // Se a IBM ficar indisponível, o assistente continua funcionando com o motor local
      console.error("[assistente] Falha no IBM Watson, usando motor local:", e);
    }
  }
  return conversarLocalmente(texto, contexto);
}

function paraBloco(item: Generic): Bloco | null {
  if (item.response_type === "text") {
    const textoResposta = String((item as { text?: string }).text ?? "").trim();
    return textoResposta ? { tipo: "texto", texto: textoResposta } : null;
  }
  if (item.response_type === "option") {
    const opcoes = item as { title?: string; options?: { label: string; value: { input: { text: string } } }[] };
    return {
      tipo: "opcoes",
      titulo: opcoes.title,
      opcoes: (opcoes.options ?? []).map((o) => ({ rotulo: o.label, texto: o.value.input.text })),
    };
  }
  if (item.response_type === "suggestion") {
    const sugestao = item as { title?: string; suggestions?: { label: string; value: { input: { text: string } } }[] };
    return {
      tipo: "opcoes",
      titulo: sugestao.title,
      opcoes: (sugestao.suggestions ?? []).map((o) => ({ rotulo: o.label, texto: o.value.input.text })),
    };
  }
  return null;
}

/** Remove as variáveis de slot já usadas, para a próxima tarefa começar do zero. */
function limparVariaveis(contexto: unknown, nomes: string[]) {
  if (!contexto || typeof contexto !== "object" || nomes.length === 0) return contexto;
  const copia = structuredClone(contexto) as Record<string, unknown>;

  // Motor local: { motor: "local", vars: {...} }
  const vars = copia.vars as Record<string, unknown> | undefined;
  if (vars) nomes.forEach((n) => delete vars[n]);

  // IBM Watson (API v2): { skills: { "main skill": { user_defined: {...} } } }
  const skills = copia.skills as Record<string, { user_defined?: Record<string, unknown> }> | undefined;
  for (const skill of Object.values(skills ?? {})) {
    if (skill?.user_defined) nomes.forEach((n) => delete skill.user_defined![n]);
  }

  return copia;
}

function localizacaoValida(valor: unknown): Localizacao | null {
  if (!valor || typeof valor !== "object") return null;
  const { latitude, longitude } = valor as Localizacao;
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}

/** Aceita apenas um caminho interno do site — o valor volta em links de login do chat. */
function caminhoValido(valor: unknown) {
  const bruto = String(valor ?? "");
  if (bruto.startsWith("/") && !bruto.startsWith("//")) return bruto;
  try {
    return new URL(bruto).pathname;
  } catch {
    return "/";
  }
}
