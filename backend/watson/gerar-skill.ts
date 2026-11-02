// Gera watson/reuse-assistente-dialog.json, o arquivo importado no IBM watsonx Assistant.
// Uso: npm run assistente:gerar
//
// As fontes legíveis ficam em watson/fonte/. O JSON gerado segue o formato de "dialog skill"
// (API v1 workspace) e também é lido pelo motor local do ReUse! quando não há credenciais do Watson.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { INTENCOES } from "./fonte/intencoes";
import { ENTIDADES } from "./fonte/entidades";
import { DIALOGO, type Resposta } from "./fonte/dialogo";

type NoWatson = Record<string, unknown> & { dialog_node: string };

function paraGeneric(respostas: Resposta[]) {
  return respostas.map((r) => {
    switch (r.tipo) {
      case "texto":
        return { response_type: "text", values: [{ text: r.texto }], selection_policy: "sequential" };
      case "opcoes":
        return {
          response_type: "option",
          title: r.titulo,
          options: r.opcoes.map((o) => ({ label: o.rotulo, value: { input: { text: o.texto } } })),
        };
      case "acao":
        return { response_type: "user_defined", user_defined: r.dados };
    }
  });
}

function montarNos(): NoWatson[] {
  const nos: NoWatson[] = [];
  let anteriorRaiz: string | null = null;

  for (const no of DIALOGO) {
    const temSlots = Boolean(no.slots?.length);
    nos.push({
      dialog_node: no.id,
      title: no.titulo,
      type: temSlots ? "frame" : "standard",
      conditions: no.condicao,
      output: { generic: paraGeneric(no.respostas) },
      ...(temSlots ? { digress_out_slots: "not_allowed" } : {}),
      ...(anteriorRaiz ? { previous_sibling: anteriorRaiz } : {}),
    });
    anteriorRaiz = no.id;

    let anteriorFilho: string | null = null;
    for (const slot of no.slots ?? []) {
      const idSlot = `${no.id}__slot_${slot.variavel}`;
      nos.push({
        dialog_node: idSlot,
        type: "slot",
        parent: no.id,
        variable: `$${slot.variavel}`,
        ...(anteriorFilho ? { previous_sibling: anteriorFilho } : {}),
      });
      anteriorFilho = idSlot;

      const idEntrada = `${idSlot}__input`;
      nos.push({
        dialog_node: idEntrada,
        type: "event_handler",
        parent: idSlot,
        event_name: "input",
        conditions: slot.condicao,
        context: { [slot.variavel]: slot.valor },
      });
      nos.push({
        dialog_node: `${idSlot}__focus`,
        type: "event_handler",
        parent: idSlot,
        event_name: "focus",
        output: { generic: paraGeneric(slot.pergunta) },
        previous_sibling: idEntrada,
      });
    }

    if (no.aoCancelar) {
      nos.push({
        dialog_node: `${no.id}__cancelar`,
        type: "event_handler",
        parent: no.id,
        event_name: "generic",
        conditions: "#cancelar",
        output: { generic: paraGeneric(no.aoCancelar) },
        context: { cancelado: true },
        next_step: { behavior: "skip_all_slots" },
        ...(anteriorFilho ? { previous_sibling: anteriorFilho } : {}),
      });
    }
  }

  return nos;
}

export function montarSkill() {
  return {
    name: "ReUse! – Assistente Eco",
    description:
      "Assistente virtual da plataforma ReUse!: executa tarefas (registrar descartes, buscar pontos de coleta, favoritos, cadastro de materiais) e orienta o usuário sobre o uso da plataforma.",
    language: "pt-br",
    learning_opt_out: false,
    metadata: { api_version: { major_version: "v2", minor_version: "2018-11-08" } },
    system_settings: {
      off_topic: { enabled: true },
      disambiguation: { enabled: false },
    },
    intents: INTENCOES.map((i) => ({
      intent: i.nome,
      description: i.descricao,
      examples: i.exemplos.map((text) => ({ text })),
    })),
    entities: [
      ...ENTIDADES.map((e) => ({
        entity: e.nome,
        description: e.descricao,
        fuzzy_match: true,
        values: e.valores.map((v) => ({ type: "synonyms", value: v.valor, synonyms: v.sinonimos })),
      })),
      { entity: "sys-number", values: [] },
    ],
    counterexamples: [],
    dialog_nodes: montarNos(),
  };
}

const destino = join(__dirname, "reuse-assistente-dialog.json");
const skill = montarSkill();
writeFileSync(destino, JSON.stringify(skill, null, 2) + "\n", "utf8");

const exemplos = skill.intents.reduce((s, i) => s + i.examples.length, 0);
console.log(
  `Skill gerada em ${destino}\n  ${skill.intents.length} intenções (${exemplos} exemplos), ${skill.entities.length} entidades, ${skill.dialog_nodes.length} nós de diálogo`
);
