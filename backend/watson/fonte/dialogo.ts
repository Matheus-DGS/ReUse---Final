// Fluxo de diálogo do assistente Eco.
// A ordem dos nós importa: o Watson avalia de cima para baixo e responde com o primeiro que casar.
//
// Convenções usadas nas respostas (também entendidas pelo motor local de fallback):
//   $variavel          → variável de contexto preenchida por slots
//   @entidade          → valor da entidade reconhecida na frase
//   <? input.text ?>   → texto digitado pelo usuário
//   resposta "acao"    → vira um response_type "user_defined"; o backend do ReUse! executa a tarefa

export type Opcao = { rotulo: string; texto: string };

export type Resposta =
  | { tipo: "texto"; texto: string }
  | { tipo: "opcoes"; titulo: string; opcoes: Opcao[] }
  | { tipo: "acao"; dados: Record<string, string | number | boolean> };

export type Slot = {
  variavel: string;
  condicao: string;
  valor: string;
  pergunta: Resposta[];
};

export type No = {
  id: string;
  titulo: string;
  condicao: string;
  respostas: Resposta[];
  slots?: Slot[];
  /** Tratador de cancelamento enquanto o usuário preenche os slots */
  aoCancelar?: Resposta[];
};

// ------------------------------------------------------------------ utilitários de conteúdo

const texto = (t: string): Resposta => ({ tipo: "texto", texto: t });
const opcoes = (titulo: string, lista: [string, string][]): Resposta => ({
  tipo: "opcoes",
  titulo,
  opcoes: lista.map(([rotulo, t]) => ({ rotulo, texto: t })),
});
const acao = (dados: Record<string, string | number | boolean>): Resposta => ({ tipo: "acao", dados });

const PERGUNTA_MATERIAL = (titulo: string) =>
  opcoes(titulo, [
    ["Papel", "papel"],
    ["Plástico", "plástico"],
    ["Vidro", "vidro"],
    ["Metal", "metal"],
    ["Orgânico", "orgânico"],
    ["Eletrônico", "eletrônico"],
  ]);

const MENU_TAREFAS: [string, string][] = [
  ["Registrar descarte", "quero registrar um descarte"],
  ["Achar ponto de coleta", "onde descartar perto de mim"],
  ["Meus EcoPontos", "quantos ecopontos eu tenho"],
  ["Missão do dia", "qual a missão de hoje"],
];

const MENU_DUVIDAS: [string, string][] = [
  ["Como ganho EcoPontos?", "como funcionam os ecopontos"],
  ["Como separar o lixo?", "como separar o lixo"],
  ["Como sugerir um ponto?", "como sugerir um ponto de coleta"],
];

const CANCELADO = [texto("Tudo bem, cancelei. Se precisar, é só chamar! 🌱")];

// ------------------------------------------------------------------ nós

export const DIALOGO: No[] = [
  {
    id: "boas_vindas",
    titulo: "Boas-vindas",
    condicao: "welcome",
    respostas: [
      texto(
        "Oi! Eu sou o **Eco**, o assistente virtual do ReUse! 🌱\n\nPosso **fazer tarefas por você**, como registrar descartes, encontrar pontos de coleta e favoritar materiais, e **tirar suas dúvidas** sobre a plataforma. Você pode digitar ou falar comigo pelo microfone."
      ),
      opcoes("Por onde começamos?", [...MENU_TAREFAS, ...MENU_DUVIDAS.slice(0, 2)]),
    ],
  },
  {
    id: "cancelar_solto",
    titulo: "Cancelar sem tarefa em andamento",
    condicao: "#cancelar",
    respostas: [texto("Não há nenhuma tarefa em andamento. Posso ajudar com outra coisa?"), opcoes("Sugestões", MENU_TAREFAS)],
  },

  // ================================================================ TAREFAS (execução)

  {
    id: "tarefa_registrar_descarte",
    titulo: "Tarefa: registrar descarte",
    condicao: "#registrar_descarte",
    slots: [
      {
        variavel: "categoria",
        condicao: "@material",
        valor: "@material",
        pergunta: [PERGUNTA_MATERIAL("Qual material você descartou?")],
      },
      {
        variavel: "quantidade",
        condicao: "@sys-number",
        valor: "@sys-number",
        pergunta: [texto("Quantos volumes (sacolas ou caixas)? Pode ser de **1 a 5**.")],
      },
      {
        variavel: "ponto",
        condicao: "@ponto || (slot_in_focus && !#cancelar)",
        valor: "<? input.text ?>",
        pergunta: [texto("Em qual ponto de coleta? Digite o **nome ou o bairro** (ex.: *Vila Mariana*, *TecVerde*).")],
      },
    ],
    aoCancelar: CANCELADO,
    respostas: [
      acao({
        acao: "registrar_descarte",
        categoria: "$categoria",
        quantidade: "$quantidade",
        ponto: "$ponto",
        cancelado: "$cancelado",
      }),
    ],
  },
  {
    id: "tarefa_buscar_ponto",
    titulo: "Tarefa: buscar pontos de coleta",
    condicao: "#buscar_ponto",
    slots: [
      {
        variavel: "material_busca",
        condicao: "@material",
        valor: "@material",
        pergunta: [
          opcoes("Para qual material você procura um ponto?", [
            ["Papel", "papel"],
            ["Plástico", "plástico"],
            ["Vidro", "vidro"],
            ["Metal", "metal"],
            ["Orgânico", "orgânico"],
            ["Eletrônico", "eletrônico"],
            ["Qualquer material", "qualquer material"],
          ]),
        ],
      },
    ],
    aoCancelar: CANCELADO,
    respostas: [acao({ acao: "buscar_ponto", categoria: "$material_busca", cancelado: "$cancelado" })],
  },
  {
    id: "tarefa_cadastrar_material",
    titulo: "Tarefa: cadastrar material no catálogo",
    condicao: "#cadastrar_material",
    slots: [
      {
        variavel: "nome_material",
        condicao: "slot_in_focus && !#cancelar",
        valor: "<? input.text ?>",
        pergunta: [texto("Vamos lá! Qual é o **nome** do material? (ex.: *Caixa de leite longa vida*)")],
      },
      {
        variavel: "categoria_material",
        condicao: "@material",
        valor: "@material",
        pergunta: [PERGUNTA_MATERIAL("Em qual categoria ele se encaixa?")],
      },
      {
        variavel: "descricao_material",
        condicao: "slot_in_focus && !#cancelar",
        valor: "<? input.text ?>",
        pergunta: [texto("Agora descreva o material e **como prepará-lo** para a reciclagem (mínimo de 10 caracteres).")],
      },
    ],
    aoCancelar: CANCELADO,
    respostas: [
      acao({
        acao: "cadastrar_material",
        nome: "$nome_material",
        categoria: "$categoria_material",
        descricao: "$descricao_material",
        cancelado: "$cancelado",
      }),
    ],
  },
  {
    id: "tarefa_favoritar",
    titulo: "Tarefa: favoritar material",
    condicao: "#favoritar_material",
    slots: [
      {
        variavel: "item_favorito",
        condicao: "@item || (slot_in_focus && !#cancelar)",
        valor: "<? input.text ?>",
        pergunta: [texto("Qual material do catálogo você quer favoritar? (ex.: *Garrafas PET*)")],
      },
    ],
    aoCancelar: CANCELADO,
    respostas: [acao({ acao: "favoritar_material", item: "$item_favorito", cancelado: "$cancelado" })],
  },
  {
    id: "tarefa_remover_favorito",
    titulo: "Tarefa: remover favorito",
    condicao: "#remover_favorito",
    slots: [
      {
        variavel: "item_remover",
        condicao: "@item || (slot_in_focus && !#cancelar)",
        valor: "<? input.text ?>",
        pergunta: [texto("Qual material você quer tirar dos favoritos?")],
      },
    ],
    aoCancelar: CANCELADO,
    respostas: [acao({ acao: "remover_favorito", item: "$item_remover", cancelado: "$cancelado" })],
  },
  {
    id: "tarefa_desfazer_descarte",
    titulo: "Tarefa: desfazer último descarte",
    condicao: "#desfazer_descarte",
    respostas: [acao({ acao: "desfazer_descarte" })],
  },
  {
    id: "tarefa_consultar_impacto",
    titulo: "Tarefa: consultar impacto",
    condicao: "#consultar_impacto",
    respostas: [acao({ acao: "consultar_impacto" })],
  },
  {
    id: "tarefa_missao_do_dia",
    titulo: "Tarefa: missão do dia",
    condicao: "#missao_do_dia",
    respostas: [acao({ acao: "missao_do_dia" })],
  },
  {
    id: "tarefa_consultar_ranking",
    titulo: "Tarefa: consultar ranking",
    condicao: "#consultar_ranking",
    respostas: [acao({ acao: "consultar_ranking" })],
  },
  {
    id: "tarefa_historico",
    titulo: "Tarefa: histórico de descartes",
    condicao: "#historico_descartes",
    respostas: [acao({ acao: "historico_descartes" })],
  },
  {
    id: "tarefa_listar_favoritos",
    titulo: "Tarefa: listar favoritos",
    condicao: "#listar_favoritos",
    respostas: [acao({ acao: "listar_favoritos" })],
  },
  {
    id: "tarefa_navegar",
    titulo: "Tarefa: abrir página",
    condicao: "#navegar && @pagina",
    respostas: [acao({ acao: "navegar", pagina: "@pagina" })],
  },
  {
    id: "tarefa_navegar_sem_pagina",
    titulo: "Tarefa: abrir página (sem destino)",
    condicao: "#navegar",
    respostas: [
      opcoes("Para qual página você quer ir?", [
        ["Mapa de pontos", "abrir o mapa"],
        ["Meu impacto", "ir para meu perfil"],
        ["Ranking", "abrir o ranking"],
        ["Catálogo", "abrir o catálogo"],
        ["Favoritos", "abrir os favoritos"],
      ]),
    ],
  },

  // ================================================================ ORIENTAÇÕES (ajuda)

  {
    id: "ajuda_registrar_descarte",
    titulo: "Ajuda: registrar descarte",
    condicao: "#ajuda_registrar_descarte",
    respostas: [
      texto(
        "Registrar um descarte é simples:\n\n1. Leve o material separado até um ponto de coleta.\n2. Abra o ponto em [Pontos de coleta](/pontos) e clique em **Detalhes**.\n3. No quadro **Registre seu descarte**, escolha o material e a quantidade de volumes (1 a 5).\n4. Clique em **Registrar descarte** e veja os EcoPontos que você ganhou. 🎉\n\n💡 Atalho: é só me dizer algo como *“registrei 2 sacolas de vidro no Ecoponto Vila Mariana”* que eu faço o registro para você. É preciso estar logado."
      ),
      opcoes("Quer tentar agora?", [
        ["Registrar pelo chat", "quero registrar um descarte"],
        ["Achar um ponto", "onde descartar perto de mim"],
      ]),
    ],
  },
  {
    id: "ajuda_sugerir_ponto",
    titulo: "Ajuda: sugerir ponto de coleta",
    condicao: "#ajuda_sugerir_ponto",
    respostas: [
      texto(
        "Conhece um local que ainda não está no mapa? Veja como sugerir:\n\n1. Entre na sua conta.\n2. Acesse [Sugerir ponto](/pontos/novo) (também há um botão no fim da página de pontos).\n3. Preencha nome, tipo, horário e **marque os materiais aceitos**.\n4. **Clique no mapa** para marcar a posição exata, ou use **Estou no local** se estiver lá.\n5. Envie a sugestão.\n\nO ponto aparece na hora com o selo **Comunidade** e você ganha **+30 EcoPontos** e a conquista **Mapeador**. ✚"
      ),
      opcoes("Mais alguma coisa?", [
        ["Abrir sugerir ponto", "ir para a tela de sugerir ponto"],
        ["O que é o selo Comunidade?", "o que quer dizer o selo comunidade"],
      ]),
    ],
  },
  {
    id: "ajuda_cadastrar_material",
    titulo: "Ajuda: cadastrar material",
    condicao: "#ajuda_cadastrar_material",
    respostas: [
      texto(
        "Para cadastrar um material no catálogo:\n\n1. Entre na sua conta.\n2. Abra o [Catálogo](/materiais) e clique em **+ Cadastrar material**.\n3. Informe o **nome**, escolha a **categoria** e descreva **como descartar** o material.\n4. Se quiser, cole o **link de uma foto** (começando com https://). Sem foto, o card usa a cor da categoria.\n5. Clique em **Cadastrar material** e ganhe **+10 EcoPontos**.\n\n💡 Também dá para cadastrar por aqui: diga *“quero cadastrar um material”*."
      ),
      opcoes("O que prefere?", [
        ["Cadastrar pelo chat", "quero cadastrar um material"],
        ["Abrir o formulário", "abrir formulário de novo material"],
      ]),
    ],
  },
  {
    id: "ajuda_ecopontos",
    titulo: "Ajuda: EcoPontos, níveis e missão",
    condicao: "#ajuda_ecopontos",
    respostas: [
      texto(
        "Os **EcoPontos** recompensam o descarte correto. Cada volume (sacola ou caixa) vale:\n\n- **Orgânico:** 4 pontos\n- **Papel e plástico:** 5 pontos\n- **Vidro e metal:** 8 pontos\n- **Eletrônico:** 15 pontos, porque é o resíduo mais perigoso no lixo comum\n\n**Bônus:** +20 na **missão do dia** (a categoria muda todo dia), +10 no primeiro descarte em cada ponto, +30 por ponto sugerido e +10 por material cadastrado.\n\n**Níveis:** Semente (0) → Broto (60) → Muda (180) → Árvore (400) → Floresta (800). Acompanhe tudo em [Meu impacto](/perfil)."
      ),
      opcoes("Quer consultar?", [
        ["Meus EcoPontos", "quantos ecopontos eu tenho"],
        ["Missão de hoje", "qual a missão de hoje"],
      ]),
    ],
  },
  {
    id: "ajuda_conquistas",
    titulo: "Ajuda: conquistas e ranking",
    condicao: "#ajuda_conquistas",
    respostas: [
      texto(
        "Existem **9 conquistas** e elas são desbloqueadas automaticamente:\n\n- **Primeiro passo:** registrar o primeiro descarte\n- **Separador nato:** descartar 4 categorias diferentes\n- **Explorador urbano:** usar 3 pontos diferentes\n- **Hábito verde:** descartar em 3 dias diferentes\n- **Caçador de e-lixo:** descartar um eletrônico\n- **Mapeador:** sugerir um ponto\n- **Curador:** cadastrar um material\n- **Colecionador:** salvar 5 favoritos\n- **Cem EcoPontos:** somar 100 pontos\n\nNo [Ranking](/ranking) você aparece com o primeiro nome e a inicial do sobrenome. Há o ranking **geral** e o **do mês**."
      ),
      opcoes("Ver agora?", [
        ["Minha posição", "qual minha posição no ranking"],
        ["Minhas conquistas", "ver meu impacto"],
      ]),
    ],
  },
  {
    id: "ajuda_limite",
    titulo: "Ajuda: limite diário e pontos não recebidos",
    condicao: "#ajuda_limite",
    respostas: [
      texto(
        "Algumas regras garantem um ranking justo:\n\n- **Limite diário:** até **5 registros de descarte por dia**. O contador zera à meia-noite (horário de Brasília).\n- **Material aceito:** o ponto precisa receber o material informado. Veja os materiais na página do ponto.\n- **Missão do dia:** o bônus de +20 vale só no **primeiro** descarte da categoria do dia.\n- **Registro errado?** Você pode desfazer o último descarte em até 30 minutos. É só me pedir: *“desfazer meu último descarte”*."
      ),
    ],
  },
  {
    id: "ajuda_localizacao",
    titulo: "Ajuda: localização e rota",
    condicao: "#ajuda_localizacao",
    respostas: [
      texto(
        "Para encontrar o ponto mais perto de você:\n\n1. Abra [Pontos de coleta](/pontos) e clique em **Perto de mim**.\n2. Quando o navegador perguntar, clique em **Permitir**.\n3. A lista passa a ser ordenada pela distância e o ponto mais próximo aparece em destaque.\n\n**Apareceu “permissão negada”?** Clique no ícone de cadeado ao lado do endereço do site, ative **Localização** e recarregue a página. Outra opção é buscar pelo seu bairro.\n\n**Como chegar:** na página do ponto, use **Traçar rota até aqui**. A rota abre no Google Maps."
      ),
      opcoes("Quer que eu procure?", [["Pontos perto de mim", "onde descartar perto de mim"]]),
    ],
  },
  {
    id: "ajuda_favoritos",
    titulo: "Ajuda: favoritos",
    condicao: "#ajuda_favoritos",
    respostas: [
      texto(
        "Os **favoritos** guardam materiais que você quer consultar depois:\n\n1. Abra um material no [Catálogo](/materiais).\n2. Clique em **☆ Favoritar**. Para remover, clique de novo em **★ Favoritado**.\n3. Veja a lista completa em [Favoritos](/favoritos).\n\nPor aqui também funciona: *“favoritar garrafa pet”* ou *“tirar pilhas dos favoritos”*."
      ),
      opcoes("Atalhos", [
        ["Ver meus favoritos", "meus favoritos"],
        ["Favoritar um material", "favoritar material"],
      ]),
    ],
  },
  {
    id: "ajuda_conta",
    titulo: "Ajuda: conta",
    condicao: "#ajuda_conta",
    respostas: [
      texto(
        "Sobre a sua conta:\n\n- **Criar conta:** acesse [Criar conta](/cadastro) e informe nome, e-mail e uma senha com pelo menos 6 caracteres.\n- **Entrar:** use [Entrar](/login) com e-mail e senha.\n- **Sair:** clique em **Sair**, no canto superior direito (no celular, dentro do menu ☰).\n- **Esqueci a senha:** a recuperação automática ainda não está disponível. Crie uma nova conta ou fale com a equipe do projeto.\n\nSem conta você já pode ver o mapa, o catálogo e o ranking. Para **registrar descartes, favoritar e sugerir pontos**, é preciso entrar."
      ),
    ],
  },

  // Separação por material (condições com o valor da entidade)
  {
    id: "ajuda_separacao_papel",
    titulo: "Ajuda: separação — papel",
    condicao: "#ajuda_separacao && @material:PAPEL",
    respostas: [
      texto(
        "📦 **Papel e papelão (coletor azul)**\n\n✅ **Pode:** caixas, jornais, revistas, cadernos e folhas.\n❌ **Não pode:** papel engordurado (caixa de pizza suja), guardanapo usado, papel higiênico e papel plastificado.\n\n**Como preparar:** mantenha **limpo e seco** e **desmonte as caixas** para ocupar menos espaço."
      ),
      opcoes("Próximo passo", [["Onde descartar papel?", "onde descartar papel"]]),
    ],
  },
  {
    id: "ajuda_separacao_plastico",
    titulo: "Ajuda: separação — plástico",
    condicao: "#ajuda_separacao && @material:PLASTICO",
    respostas: [
      texto(
        "🧴 **Plástico (coletor vermelho)**\n\n✅ **Pode:** garrafas PET, potes, sacolas, embalagens de limpeza e tampinhas.\n❌ **Evite:** embalagens muito sujas de comida e fraldas. O **isopor** é reciclável, mas nem todo ponto recebe: confirme antes de levar.\n\n**Como preparar:** **enxágue** para tirar restos e **amasse** as garrafas. A tampinha pode ir junto."
      ),
      opcoes("Próximo passo", [["Onde descartar plástico?", "onde descartar plástico"]]),
    ],
  },
  {
    id: "ajuda_separacao_vidro",
    titulo: "Ajuda: separação — vidro",
    condicao: "#ajuda_separacao && @material:VIDRO",
    respostas: [
      texto(
        "🍾 **Vidro (coletor verde)**\n\n✅ **Pode:** garrafas, potes e frascos.\n❌ **Não pode:** espelho, lâmpada, cerâmica, porcelana e vidro temperado de box ou janela.\n\n**Como preparar:** retire as tampas e enxágue. **Vidro quebrado** deve ir **embrulhado em jornal** ou dentro de uma caixa identificada, para proteger quem faz a coleta."
      ),
      opcoes("Próximo passo", [["Onde descartar vidro?", "onde descartar vidro"]]),
    ],
  },
  {
    id: "ajuda_separacao_metal",
    titulo: "Ajuda: separação — metal",
    condicao: "#ajuda_separacao && @material:METAL",
    respostas: [
      texto(
        "🥫 **Metal (coletor amarelo)**\n\n✅ **Pode:** latas de bebida e de conserva, tampinhas metálicas, papel-alumínio limpo e panelas sem cabo.\n❌ **Atenção:** latas de **tinta ou aerossol** só vão para a reciclagem **vazias e secas**. Com resto de produto, procure um ecoponto.\n\n**Como preparar:** **lave e amasse** as latas."
      ),
      opcoes("Próximo passo", [["Onde descartar metal?", "onde descartar metal"]]),
    ],
  },
  {
    id: "ajuda_separacao_organico",
    titulo: "Ajuda: separação — orgânico",
    condicao: "#ajuda_separacao && @material:ORGANICO",
    respostas: [
      texto(
        "🍂 **Orgânico (coletor marrom)**\n\n✅ **Pode (compostagem):** cascas de frutas e legumes, folhas, borra e filtro de café e casca de ovo.\n❌ **Não pode:** carnes, ossos, laticínios, óleo e fezes de animais, porque atraem pragas e atrapalham a compostagem.\n\n**Como preparar:** guarde em um pote fechado e leve a uma **composteira** ou feira parceira."
      ),
      opcoes("Próximo passo", [["Onde descartar orgânico?", "onde descartar orgânico"]]),
    ],
  },
  {
    id: "ajuda_separacao_eletronico",
    titulo: "Ajuda: separação — eletrônico",
    condicao: "#ajuda_separacao && @material:ELETRONICO",
    respostas: [
      texto(
        "🔋 **Eletrônicos, pilhas e baterias (coletor laranja)**\n\n⚠️ **Nunca vão no lixo comum**, porque contêm metais pesados que contaminam o solo e a água.\n\n✅ **Leve a um ponto específico:** pilhas, baterias, celulares, carregadores, cabos e pequenos aparelhos.\n\n**Como preparar:** apague seus dados do celular, **isole os polos das baterias com fita** e guarde as pilhas em um pote fechado até o descarte."
      ),
      opcoes("Próximo passo", [["Onde descartar eletrônicos?", "onde descartar eletrônico"]]),
    ],
  },
  {
    id: "ajuda_separacao_geral",
    titulo: "Ajuda: separação — geral",
    condicao: "#ajuda_separacao",
    respostas: [
      texto(
        "A regra de ouro da separação: **limpo, seco e separado por tipo**. ♻️\n\n1. Separe **recicláveis secos** (papel, plástico, vidro e metal) dos **orgânicos**.\n2. **Enxágue** embalagens com restos de comida.\n3. **Eletrônicos e pilhas** vão sempre para pontos específicos.\n4. Na dúvida, consulte o [Catálogo de materiais](/materiais).\n\nSobre qual material você quer saber mais?"
      ),
      PERGUNTA_MATERIAL("Escolha um material"),
    ],
  },

  // Tipos de ponto
  {
    id: "ajuda_tipo_ecoponto",
    titulo: "Ajuda: o que é ecoponto",
    condicao: "#ajuda_tipos_ponto && @tipo_ponto:ECOPONTO",
    respostas: [
      texto(
        "**Ecoponto** é uma área pública, geralmente da prefeitura, para entregar **volumes maiores e materiais variados**: recicláveis, pequenos volumes de entulho, móveis velhos e, em alguns casos, eletrônicos. É gratuito para moradores."
      ),
    ],
  },
  {
    id: "ajuda_tipo_pev",
    titulo: "Ajuda: o que é PEV",
    condicao: "#ajuda_tipos_ponto && @tipo_ponto:PEV",
    respostas: [
      texto(
        "**PEV (Ponto de Entrega Voluntária)** são aqueles **contêineres coloridos** de coleta seletiva em praças, estações e parques. São ótimos para **pequenas quantidades** de papel, plástico, vidro e metal no dia a dia."
      ),
    ],
  },
  {
    id: "ajuda_tipo_cooperativa",
    titulo: "Ajuda: o que é cooperativa",
    condicao: "#ajuda_tipos_ponto && @tipo_ponto:COOPERATIVA",
    respostas: [
      texto(
        "**Cooperativas** são organizações de **catadores** que fazem a triagem e a venda dos recicláveis. Levar seu material até elas **gera renda** para as famílias cooperadas e garante que ele seja reaproveitado."
      ),
    ],
  },
  {
    id: "ajuda_tipo_parceiro",
    titulo: "Ajuda: o que é parceiro",
    condicao: "#ajuda_tipos_ponto && @tipo_ponto:PARCEIRO",
    respostas: [
      texto(
        "**Parceiros** são estabelecimentos, como lojas, mercados e hortas comunitárias, que recebem **materiais específicos**, por exemplo coletores de pilhas e eletrônicos ou composteiras para orgânicos."
      ),
    ],
  },
  {
    id: "ajuda_tipos_geral",
    titulo: "Ajuda: tipos de ponto e selos",
    condicao: "#ajuda_tipos_ponto",
    respostas: [
      texto(
        "No mapa você encontra 4 tipos de ponto:\n\n- **Ecoponto:** área pública para volumes maiores e materiais variados.\n- **PEV:** contêineres de coleta seletiva para pequenas quantidades.\n- **Cooperativa:** catadores que triam e vendem o material.\n- **Parceiro:** estabelecimento que recebe materiais específicos.\n\n**Selos:** ✓ **Verificado** indica ponto conferido pela equipe. **Comunidade** indica ponto sugerido por usuários, ainda sem verificação. O **anel colorido** do pino mostra os materiais aceitos."
      ),
    ],
  },
  {
    id: "sobre_reuse",
    titulo: "Sobre o ReUse!",
    condicao: "#sobre_reuse",
    respostas: [
      texto(
        "O **ReUse!** é uma plataforma de incentivo à reciclagem criada em um projeto acadêmico da FIAP. Ela ajuda você a:\n\n- **Encontrar** pontos de coleta perto de você\n- **Aprender** a separar e preparar cada material\n- **Registrar** seus descartes e acompanhar o seu impacto com EcoPontos, níveis e ranking\n\nEu, o Eco, sou o assistente virtual da plataforma, construído com **IBM Watson**."
      ),
    ],
  },
  {
    id: "menu_ajuda",
    titulo: "Menu: o que o Eco faz",
    condicao: "#o_que_voce_faz",
    respostas: [
      texto(
        "Eu faço duas coisas:\n\n**⚡ Tarefas na plataforma**\n- Registrar e desfazer descartes\n- Encontrar pontos de coleta perto de você\n- Consultar EcoPontos, nível, missão, ranking e histórico\n- Favoritar e remover materiais, e cadastrar materiais no catálogo\n- Abrir páginas (*“abrir o mapa”*)\n\n**💬 Orientações**\n- Como registrar descartes e sugerir pontos\n- Como ganhar EcoPontos e conquistas\n- Como separar cada material\n- Localização, rotas, favoritos e conta"
      ),
      opcoes("Experimente", [...MENU_TAREFAS, ...MENU_DUVIDAS]),
    ],
  },

  // ================================================================ CONVERSA

  {
    id: "saudacao",
    titulo: "Saudação",
    condicao: "#saudacao",
    respostas: [texto("Oi! 👋 Sou o Eco. Em que posso ajudar hoje?"), opcoes("Sugestões", MENU_TAREFAS)],
  },
  {
    id: "agradecimento",
    titulo: "Agradecimento",
    condicao: "#agradecimento",
    respostas: [texto("Imagina! O planeta agradece também. 🌎 Precisa de mais alguma coisa?")],
  },
  {
    id: "despedida",
    titulo: "Despedida",
    condicao: "#despedida",
    respostas: [texto("Até mais! Continue separando direitinho. ♻️")],
  },
  {
    id: "nao_entendi",
    titulo: "Não entendi",
    condicao: "anything_else",
    respostas: [
      texto("Hmm, não entendi. 🤔 Tente com outras palavras ou escolha uma opção abaixo. Digite **ajuda** para ver tudo o que eu sei fazer."),
      opcoes("Posso ajudar com", [...MENU_TAREFAS, ...MENU_DUVIDAS]),
    ],
  },
];
