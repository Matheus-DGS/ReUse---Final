// Testes do fluxo conversacional (motor local que interpreta a skill do Watson).
// Uso: npm run assistente:testar

import { classificarIntencao, conversarLocalmente, reconhecerEntidades } from "../src/assistente/motor-local";

let falhas = 0;
const ok = (descricao: string, condicao: boolean, detalhe = "") => {
  if (!condicao) falhas++;
  console.log(`${condicao ? "✔" : "✘"} ${descricao}${!condicao && detalhe ? `  →  ${detalhe}` : ""}`);
};

// Frases que NÃO estão nos exemplos de treino, para medir generalização
const casos: [string, string | null][] = [
  ["quero registrar o descarte de hoje", "registrar_descarte"],
  ["deixei duas sacolas de papelão no ecoponto lapa", "registrar_descarte"],
  ["como eu faço pra registrar um descarte?", "ajuda_registrar_descarte"],
  ["onde posso descartar pilhas perto de casa", "buscar_ponto"],
  ["tem ecoponto perto de mim?", "buscar_ponto"],
  ["quantos pontos eu tenho?", "consultar_impacto"],
  ["qual é a missão de hoje?", "missao_do_dia"],
  ["em que lugar estou no ranking", "consultar_ranking"],
  ["salva a garrafa pet nos meus favoritos", "favoritar_material"],
  ["mostra meus favoritos", "listar_favoritos"],
  ["tira as pilhas dos favoritos", "remover_favorito"],
  ["tira a garrafa pet dos favoritos", "remover_favorito"],
  ["salva as latinhas nos favoritos", "favoritar_material"],
  ["onde fica o ecoponto mais perto de casa", "buscar_ponto"],
  ["registrar um descarte de metal", "registrar_descarte"],
  ["quero cadastrar um novo material no catálogo", "cadastrar_material"],
  ["me leva pro mapa", "navegar"],
  ["registrei errado, desfaz", "desfazer_descarte"],
  ["como sugiro um novo ponto de coleta?", "ajuda_sugerir_ponto"],
  ["como funciona a pontuação de ecopontos", "ajuda_ecopontos"],
  ["vidro quebrado pode reciclar?", "ajuda_separacao"],
  ["o que é pev?", "ajuda_tipos_ponto"],
  ["esqueci a senha", "ajuda_conta"],
  ["perto de mim não funciona", "ajuda_localizacao"],
  ["por que não recebi os pontos", "ajuda_limite"],
  ["como desbloqueio as conquistas", "ajuda_conquistas"],
  ["o que você sabe fazer?", "o_que_voce_faz"],
  ["valeu!", "agradecimento"],
  ["qual a capital da frança", null],
];

console.log("\n— Classificação de intenções");
for (const [frase, esperada] of casos) {
  const r = classificarIntencao(frase);
  ok(`"${frase}"`, (r?.nome ?? null) === esperada, `obtido ${r?.nome ?? "nenhuma"} (${r?.confianca ?? 0}), esperado ${esperada}`);
}

console.log("\n— Entidades");
const ents = reconhecerEntidades("registrei 2 garrafas de vidro no Ecoponto Vila Mariana");
ok("material VIDRO", ents.some((e) => e.entity === "material" && e.value === "VIDRO"), JSON.stringify(ents));
ok("sys-number 2", ents.some((e) => e.entity === "sys-number" && e.value === 2));
ok("ponto Vila Mariana", ents.some((e) => e.entity === "ponto" && e.value === "Ecoponto Vila Mariana"));
ok("'um descarte' não vira número", !reconhecerEntidades("quero registrar um descarte").some((e) => e.entity === "sys-number"));

console.log("\n— Fluxo: registro com slots");
const acao = (s: ReturnType<typeof conversarLocalmente>) =>
  s.generic.find((g) => g.response_type === "user_defined") as { user_defined: Record<string, unknown> } | undefined;
const textoDe = (s: ReturnType<typeof conversarLocalmente>) =>
  s.generic.map((g) => (g.response_type === "text" ? (g as { text: string }).text : g.response_type === "option" ? `[opções] ${(g as { title?: string }).title}` : "[ação]")).join(" | ");

let t = conversarLocalmente("", null);
ok("boas-vindas", textoDe(t).includes("Eco"), textoDe(t));

t = conversarLocalmente("quero registrar um descarte", t.contexto);
ok("pergunta o material", textoDe(t).includes("material"), textoDe(t));
t = conversarLocalmente("vidro", t.contexto);
ok("pergunta a quantidade", textoDe(t).toLowerCase().includes("volumes"), textoDe(t));
t = conversarLocalmente("3", t.contexto);
ok("pergunta o ponto", textoDe(t).includes("ponto"), textoDe(t));
t = conversarLocalmente("Aclimação", t.contexto);
const a1 = acao(t)?.user_defined;
ok("gera ação registrar_descarte", a1?.acao === "registrar_descarte" && a1?.categoria === "VIDRO" && Number(a1?.quantidade) === 3 && String(a1?.ponto).includes("Aclima"), JSON.stringify(a1));

console.log("\n— Fluxo: tudo em uma frase");
t = conversarLocalmente("registrei 2 sacolas de papelão no ecoponto lapa", null);
const a2 = acao(t)?.user_defined;
ok("ação direta com slots preenchidos", a2?.categoria === "PAPEL" && Number(a2?.quantidade) === 2, JSON.stringify(a2) + " " + textoDe(t));

console.log("\n— Fluxo: cancelamento");
t = conversarLocalmente("quero registrar um descarte", null);
t = conversarLocalmente("deixa pra lá", t.contexto);
const a3 = acao(t)?.user_defined;
ok("cancela e marca cancelado", textoDe(t).includes("cancelei") && a3?.cancelado === true, textoDe(t));

console.log("\n— Fluxo: cadastro de material");
t = conversarLocalmente("quero cadastrar um material", null);
t = conversarLocalmente("Caixa de leite longa vida", t.contexto);
ok("pergunta categoria", textoDe(t).includes("categoria"), textoDe(t));
t = conversarLocalmente("papel", t.contexto);
t = conversarLocalmente("Embalagem cartonada; enxágue e amasse antes de descartar.", t.contexto);
const a4 = acao(t)?.user_defined;
ok("gera ação cadastrar_material", a4?.acao === "cadastrar_material" && a4?.nome === "Caixa de leite longa vida" && a4?.categoria === "PAPEL", JSON.stringify(a4));

console.log("\n— Orientação por material");
t = conversarLocalmente("como descartar vidro quebrado", null);
ok("resposta específica de vidro", textoDe(t).includes("jornal"), textoDe(t));

console.log(`\n${falhas === 0 ? "Todos os testes passaram." : `${falhas} falha(s).`}`);
process.exit(falhas ? 1 : 0);
