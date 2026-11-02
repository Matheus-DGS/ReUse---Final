// Motor local de conversa (fallback do IBM Watson).
//
// Interpreta o MESMO arquivo watson/reuse-assistente-dialog.json importado no watsonx Assistant:
// classifica intenções pelos exemplos (TF-IDF + cosseno), reconhece entidades pelos sinônimos e
// executa o diálogo (condições, slots, cancelamento). Suporta apenas o subconjunto de recursos
// usado na skill do ReUse!, o que garante o mesmo comportamento com ou sem credenciais da IBM.

import skill from "../../watson/reuse-assistente-dialog.json";
import type { Generic, SaidaMotor } from "./motor";
import { contemTrecho, normalizar, termosRelevantes } from "./texto";

// ------------------------------------------------------------------ tipos da skill

type NoSkill = {
  dialog_node: string;
  type?: string;
  parent?: string;
  conditions?: string;
  variable?: string;
  event_name?: string;
  context?: Record<string, unknown>;
  output?: { generic?: Record<string, unknown>[] };
  next_step?: { behavior: string };
};

const NOS = skill.dialog_nodes as NoSkill[];
const RAIZ = NOS.filter((n) => !n.parent);
const filhos = (id: string) => NOS.filter((n) => n.parent === id);

export type ContextoLocal = {
  motor: "local";
  vars: Record<string, unknown>;
  frame: string | null;
  iniciado: boolean;
};

// ------------------------------------------------------------------ NLU: intenções

const LIMIAR_CONFIANCA = 0.34;

type Vetor = Map<string, number>;

const exemplosTokenizados = skill.intents.flatMap((i) =>
  i.examples.map((e) => ({ intencao: i.intent, termos: termosRelevantes(e.text) }))
);

const idf = (() => {
  const df = new Map<string, number>();
  for (const e of exemplosTokenizados) for (const t of new Set(e.termos)) df.set(t, (df.get(t) ?? 0) + 1);
  const total = exemplosTokenizados.length;
  return (termo: string) => Math.log((total + 1) / ((df.get(termo) ?? 0) + 1)) + 1;
})();

function vetorizar(termos: string[]): Vetor {
  const v: Vetor = new Map();
  for (const t of termos) v.set(t, (v.get(t) ?? 0) + idf(t));
  return v;
}

function cosseno(a: Vetor, b: Vetor) {
  let produto = 0;
  let na = 0;
  let nb = 0;
  for (const [t, x] of a) {
    na += x * x;
    const y = b.get(t);
    if (y) produto += x * y;
  }
  for (const y of b.values()) nb += y * y;
  return na && nb ? produto / Math.sqrt(na * nb) : 0;
}

const vetoresExemplos = exemplosTokenizados.map((e) => ({ intencao: e.intencao, vetor: vetorizar(e.termos) }));

const vocabulario = [...new Set(exemplosTokenizados.flatMap((e) => e.termos))];

/** Aproxima palavras fora do vocabulário por prefixo comum ("tira" → "tirar", "sugiro" → "sugeri"). */
function aproximarDoVocabulario(termo: string) {
  if (termo.length < 4 || vocabulario.includes(termo)) return termo;
  let melhor = termo;
  let maiorPrefixo = 3;
  for (const v of vocabulario) {
    let i = 0;
    while (i < Math.min(v.length, termo.length) && v[i] === termo[i]) i++;
    const cobreMenor = i === Math.min(v.length, termo.length);
    if (i > maiorPrefixo && (cobreMenor || i >= 5) && Math.abs(v.length - termo.length) <= 3) {
      maiorPrefixo = i;
      melhor = v;
    }
  }
  return melhor;
}

export function classificarIntencao(texto: string) {
  const entrada = vetorizar(termosRelevantes(texto).map(aproximarDoVocabulario));
  const melhores = new Map<string, number>();
  for (const e of vetoresExemplos) {
    const s = cosseno(entrada, e.vetor);
    if (s > (melhores.get(e.intencao) ?? 0)) melhores.set(e.intencao, s);
  }
  const [nome, confianca] = [...melhores.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
  return confianca >= LIMIAR_CONFIANCA ? { nome, confianca: Number(confianca.toFixed(3)) } : null;
}

// ------------------------------------------------------------------ NLU: entidades

type EntidadeEncontrada = { entity: string; value: string | number; location: number };

const NUMEROS_POR_EXTENSO: Record<string, number> = {
  dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};

export function reconhecerEntidades(texto: string): EntidadeEncontrada[] {
  const encontradas: (EntidadeEncontrada & { tamanho: number })[] = [];

  for (const entidade of skill.entities) {
    if (entidade.entity === "sys-number") continue;
    for (const valor of entidade.values as { value: string; synonyms?: string[] }[]) {
      for (const termo of [valor.value, ...(valor.synonyms ?? [])]) {
        const posicao = contemTrecho(texto, termo);
        if (posicao >= 0) {
          encontradas.push({ entity: entidade.entity, value: valor.value, location: posicao, tamanho: normalizar(termo).length });
        }
      }
    }
  }

  // Para cada entidade, fica o valor do trecho mais longo em cada posição ("garrafa pet" vence "pet")
  encontradas.sort((a, b) => b.tamanho - a.tamanho);
  const resultado: EntidadeEncontrada[] = [];
  for (const e of encontradas) {
    const repetida = resultado.some((r) => r.entity === e.entity && (r.value === e.value || r.location === e.location));
    if (!repetida) resultado.push({ entity: e.entity, value: e.value, location: e.location });
  }

  // @sys-number: dígitos ou números por extenso ("um/uma" só quando acompanham volumes)
  const tokens = normalizar(texto).split(" ");
  tokens.forEach((t, i) => {
    let numero: number | null = null;
    if (/^\d+$/.test(t)) numero = Number(t);
    else if (t in NUMEROS_POR_EXTENSO) numero = NUMEROS_POR_EXTENSO[t];
    else if ((t === "um" || t === "uma") && (tokens.length === 1 || /^(sacol|saco|caixa|volum|pacot)/.test(tokens[i + 1] ?? ""))) numero = 1;
    if (numero !== null) resultado.push({ entity: "sys-number", value: numero, location: i });
  });

  return resultado.sort((a, b) => a.location - b.location);
}

// ------------------------------------------------------------------ avaliação de condições

type Ambiente = {
  intencao: string | null;
  entidades: EntidadeEncontrada[];
  vars: Record<string, unknown>;
  texto: string;
  boasVindas: boolean;
  slotEmFoco: boolean;
};

/** Avalia o subconjunto de SpEL usado na skill: #intent, @entity(:valor), $var, !, &&, ||, (). */
export function avaliarCondicao(expressao: string, amb: Ambiente): boolean {
  const tokens = expressao.match(/&&|\|\||!|\(|\)|[#@$][\w-]+(?::[\w-]+)?|[\w-]+/g) ?? [];
  let i = 0;

  const primario = (): boolean => {
    const t = tokens[i++];
    if (t === "!") return !primario();
    if (t === "(") {
      const v = ou();
      i++; // ")"
      return v;
    }
    if (t.startsWith("#")) return amb.intencao === t.slice(1);
    if (t.startsWith("@")) {
      const [nome, valor] = t.slice(1).split(":");
      return amb.entidades.some((e) => e.entity === nome && (valor === undefined || String(e.value) === valor));
    }
    if (t.startsWith("$")) return Boolean(amb.vars[t.slice(1)]);
    if (t === "welcome") return amb.boasVindas;
    if (t === "anything_else" || t === "true") return true;
    if (t === "slot_in_focus") return amb.slotEmFoco;
    return false;
  };
  const e = (): boolean => {
    let v = primario();
    while (tokens[i] === "&&") {
      i++;
      const d = primario();
      v = v && d;
    }
    return v;
  };
  const ou = (): boolean => {
    let v = e();
    while (tokens[i] === "||") {
      i++;
      const d = e();
      v = v || d;
    }
    return v;
  };

  return ou();
}

/** Resolve valores como "@material", "$categoria" e "<? input.text ?>". */
function resolverValor(valor: unknown, amb: Ambiente): unknown {
  if (typeof valor !== "string") return valor;
  const v = valor.trim();
  if (/^<\?\s*input\.text\s*\?>$/.test(v)) return amb.texto;
  if (/^@[\w-]+$/.test(v)) return amb.entidades.find((e) => e.entity === v.slice(1))?.value ?? null;
  if (/^\$\w+$/.test(v)) return amb.vars[v.slice(1)] ?? null;
  return valor.replace(/\$(\w+)/g, (_, nome) => String(amb.vars[nome] ?? ""));
}

function saidaDoNo(no: NoSkill | undefined, amb: Ambiente): Generic[] {
  return (no?.output?.generic ?? []).map((g) => {
    if (g.response_type === "text") {
      const valores = g.values as { text: string }[];
      return { response_type: "text", text: String(resolverValor(valores[0]?.text ?? "", amb)) };
    }
    if (g.response_type === "user_defined") {
      const dados = Object.fromEntries(
        Object.entries(g.user_defined as Record<string, unknown>).map(([k, v]) => [k, resolverValor(v, amb)])
      );
      return { response_type: "user_defined", user_defined: dados };
    }
    return g as Generic;
  });
}

function aplicarContexto(no: NoSkill | undefined, amb: Ambiente) {
  for (const [nome, valor] of Object.entries(no?.context ?? {})) amb.vars[nome] = resolverValor(valor, amb);
}

// ------------------------------------------------------------------ execução do diálogo

function slotsDoFrame(frameId: string) {
  return filhos(frameId)
    .filter((n) => n.type === "slot")
    .map((slot) => {
      const tratadores = filhos(slot.dialog_node);
      return {
        variavel: (slot.variable ?? "").replace(/^\$/, ""),
        entrada: tratadores.find((t) => t.event_name === "input"),
        foco: tratadores.find((t) => t.event_name === "focus"),
      };
    });
}

/** Preenche slots com a entrada atual; devolve true se algum foi preenchido. */
function preencherSlots(frameId: string, amb: Ambiente, emAndamento: boolean) {
  const slots = slotsDoFrame(frameId);
  const emFoco = emAndamento ? slots.find((s) => amb.vars[s.variavel] == null) : undefined;
  let preencheu = false;
  for (const s of slots) {
    if (amb.vars[s.variavel] != null || !s.entrada?.conditions) continue;
    const ambSlot = { ...amb, slotEmFoco: s === emFoco };
    if (avaliarCondicao(s.entrada.conditions, ambSlot)) {
      aplicarContexto(s.entrada, amb);
      preencheu = preencheu || amb.vars[s.variavel] != null;
    }
  }
  return preencheu;
}

function concluirOuPerguntar(frame: NoSkill, amb: Ambiente, ctx: ContextoLocal, saida: Generic[]) {
  const pendente = slotsDoFrame(frame.dialog_node).find((s) => amb.vars[s.variavel] == null);
  if (pendente) {
    ctx.frame = frame.dialog_node;
    saida.push(...saidaDoNo(pendente.foco, amb));
  } else {
    ctx.frame = null;
    saida.push(...saidaDoNo(frame, amb));
  }
}

export function conversarLocalmente(texto: string, contextoAnterior: unknown): SaidaMotor {
  const ctx: ContextoLocal =
    contextoAnterior && typeof contextoAnterior === "object" && (contextoAnterior as ContextoLocal).motor === "local"
      ? structuredClone(contextoAnterior as ContextoLocal)
      : { motor: "local", vars: {}, frame: null, iniciado: false };

  const textoLimpo = texto.trim();
  const intencao = textoLimpo ? classificarIntencao(textoLimpo) : null;
  const amb: Ambiente = {
    intencao: intencao?.nome ?? null,
    entidades: textoLimpo ? reconhecerEntidades(textoLimpo) : [],
    vars: ctx.vars,
    texto: textoLimpo,
    boasVindas: !textoLimpo && !ctx.iniciado,
    slotEmFoco: false,
  };
  const saida: Generic[] = [];

  const frameAtual = ctx.frame ? NOS.find((n) => n.dialog_node === ctx.frame) : undefined;

  if (frameAtual) {
    const preencheu = preencherSlots(frameAtual.dialog_node, amb, true);
    const tratador = preencheu
      ? undefined
      : filhos(frameAtual.dialog_node).find(
          (n) => n.type === "event_handler" && n.event_name === "generic" && avaliarCondicao(n.conditions ?? "", amb)
        );

    if (tratador) {
      aplicarContexto(tratador, amb);
      saida.push(...saidaDoNo(tratador, amb));
      if (tratador.next_step?.behavior === "skip_all_slots") {
        ctx.frame = null;
        saida.push(...saidaDoNo(frameAtual, amb));
      } else {
        concluirOuPerguntar(frameAtual, amb, ctx, saida);
      }
    } else {
      concluirOuPerguntar(frameAtual, amb, ctx, saida);
    }
  } else {
    const no = RAIZ.find((n) => avaliarCondicao(n.conditions ?? "false", amb));
    if (no?.type === "frame") {
      preencherSlots(no.dialog_node, amb, false);
      concluirOuPerguntar(no, amb, ctx, saida);
    } else if (no) {
      aplicarContexto(no, amb);
      saida.push(...saidaDoNo(no, amb));
    }
  }

  ctx.iniciado = true;
  return { generic: saida, contexto: ctx, intencao, motor: "local" };
}
