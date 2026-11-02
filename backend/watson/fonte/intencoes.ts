// Intenções (#intents) do assistente Eco.
// Cada intenção tem exemplos em português usados para treinar o classificador do IBM Watson.

export type Intencao = { nome: string; descricao: string; exemplos: string[] };

// ---------------------------------------------------------------------------------------------
// 1) EXECUÇÃO DE TAREFAS NA PLATAFORMA
// ---------------------------------------------------------------------------------------------

const tarefas: Intencao[] = [
  {
    nome: "registrar_descarte",
    descricao: "Registrar um descarte e ganhar EcoPontos",
    exemplos: [
      "quero registrar um descarte",
      "registrar descarte",
      "acabei de descartar",
      "registrei 2 sacolas de vidro",
      "descartei pilhas na TecVerde",
      "levei papelão no ecoponto vila mariana",
      "deixei 3 sacos de plástico na cooperativa da mooca",
      "acabei de entregar latinhas",
      "quero ganhar pontos pelo descarte que fiz",
      "anota meu descarte",
      "registra minha reciclagem de hoje",
      "entreguei garrafas de vidro no PEV",
      "fiz um descarte agora",
      "adicionar descarte",
      "descartei 1 caixa de eletrônicos",
      "deixei sacolas de papel no ecoponto",
      "levei duas caixas de latinhas no pev santana",
      "coloquei o vidro no contêiner da cooperativa",
      "deixei o lixo reciclável no ponto de coleta",
      "hoje levei meus recicláveis ao ecoponto",
    ],
  },
  {
    nome: "desfazer_descarte",
    descricao: "Cancelar o último descarte registrado por engano",
    exemplos: [
      "desfazer meu último descarte",
      "registrei errado",
      "cancelar o descarte que acabei de fazer",
      "apaga o último registro",
      "me enganei no descarte",
      "remover último descarte",
      "quero desfazer o registro",
      "o descarte foi registrado errado",
      "estorna meu último descarte",
      "anular descarte",
    ],
  },
  {
    nome: "buscar_ponto",
    descricao: "Encontrar pontos de coleta para um material",
    exemplos: [
      "onde descarto pilhas",
      "onde posso jogar vidro",
      "ponto de coleta mais perto",
      "qual o ecoponto mais próximo",
      "onde levo meu celular velho",
      "tem lugar para descartar bateria perto de mim",
      "onde entregar latinhas",
      "procurar ponto de coleta de papel",
      "me mostra pontos que aceitam eletrônicos",
      "onde reciclar garrafa pet",
      "quero achar um lugar para descartar orgânico",
      "pontos de coleta perto de mim",
      "onde fica o ponto de coleta mais próximo",
      "buscar ponto para plástico",
    ],
  },
  {
    nome: "consultar_impacto",
    descricao: "Consultar EcoPontos, nível e conquistas do usuário",
    exemplos: [
      "quantos ecopontos eu tenho",
      "qual meu nível",
      "meu saldo de pontos",
      "ver meu impacto",
      "quanto falta para o próximo nível",
      "quais conquistas eu tenho",
      "como estou indo",
      "meu progresso",
      "quantos pontos eu já fiz",
      "mostrar meu perfil de impacto",
    ],
  },
  {
    nome: "missao_do_dia",
    descricao: "Consultar a missão diária",
    exemplos: [
      "qual a missão de hoje",
      "missão do dia",
      "tem missão hoje",
      "qual o desafio de hoje",
      "o que vale bônus hoje",
      "já cumpri a missão",
      "qual material dá bônus hoje",
      "missão diária",
    ],
  },
  {
    nome: "consultar_ranking",
    descricao: "Consultar a posição no ranking",
    exemplos: [
      "qual minha posição no ranking",
      "quem está em primeiro lugar",
      "ver ranking",
      "estou em que lugar",
      "ranking do mês",
      "quem mais reciclou",
      "top do ranking",
      "minha colocação",
    ],
  },
  {
    nome: "historico_descartes",
    descricao: "Listar os últimos descartes do usuário",
    exemplos: [
      "meus últimos descartes",
      "histórico de descartes",
      "o que eu já descartei",
      "ver meus registros",
      "quais descartes eu fiz",
      "lista dos meus descartes",
      "onde eu descartei da última vez",
    ],
  },
  {
    nome: "favoritar_material",
    descricao: "Salvar um material do catálogo nos favoritos",
    exemplos: [
      "favoritar garrafa pet",
      "salvar pilhas nos favoritos",
      "adiciona latas de alumínio aos favoritos",
      "quero guardar esse material",
      "marcar como favorito",
      "salva potes de vidro para mim",
      "colocar caixa de papelão nos favoritos",
      "favoritar material",
    ],
  },
  {
    nome: "listar_favoritos",
    descricao: "Listar os materiais favoritos",
    exemplos: [
      "meus favoritos",
      "ver favoritos",
      "quais materiais eu salvei",
      "mostrar lista de favoritos",
      "o que tem nos meus favoritos",
      "materiais salvos",
    ],
  },
  {
    nome: "remover_favorito",
    descricao: "Remover um material dos favoritos",
    exemplos: [
      "tirar garrafa pet dos favoritos",
      "remover dos favoritos",
      "desfavoritar pilhas",
      "apagar latas dos meus favoritos",
      "não quero mais esse favorito",
      "excluir favorito",
      "tira isso dos favoritos",
      "tire os potes de vidro da minha lista de favoritos",
      "retirar caixa de papelão dos favoritos",
      "remove latas dos salvos",
    ],
  },
  {
    nome: "cadastrar_material",
    descricao: "Cadastrar um novo material no catálogo",
    exemplos: [
      "quero cadastrar um material",
      "cadastrar novo material",
      "adicionar material ao catálogo",
      "incluir um item no catálogo",
      "criar material",
      "quero colocar um novo material na plataforma",
      "cadastra um item para mim",
      "novo material no catálogo",
    ],
  },
  {
    nome: "navegar",
    descricao: "Abrir uma página da plataforma",
    exemplos: [
      "abrir o mapa",
      "me leva para o ranking",
      "ir para meu perfil",
      "abre os favoritos",
      "quero ver o catálogo",
      "voltar para a página inicial",
      "ir para a tela de sugerir ponto",
      "abrir página de login",
      "mostra o mapa de pontos",
      "navegar para materiais",
      "abrir formulário de novo material",
      "abrir o catálogo",
      "abrir o ranking",
    ],
  },
  {
    nome: "cancelar",
    descricao: "Interromper a tarefa em andamento",
    exemplos: ["cancelar", "deixa pra lá", "esquece", "não quero mais", "parar", "sair dessa", "cancela isso"],
  },
];

// ---------------------------------------------------------------------------------------------
// 2) ORIENTAÇÃO E AJUDA AO USUÁRIO
// ---------------------------------------------------------------------------------------------

const orientacoes: Intencao[] = [
  {
    nome: "ajuda_registrar_descarte",
    descricao: "Como registrar um descarte",
    exemplos: [
      "como registro um descarte",
      "como faço para registrar o que descartei",
      "como ganho ecopontos descartando",
      "passo a passo para registrar descarte",
      "como funciona o registro de descarte",
      "onde eu registro meu descarte",
      "como aviso que descartei",
    ],
  },
  {
    nome: "ajuda_sugerir_ponto",
    descricao: "Como sugerir um novo ponto de coleta",
    exemplos: [
      "como sugerir um ponto de coleta",
      "conheço um ponto que não está no mapa",
      "como adiciono um ecoponto",
      "o ponto do meu bairro não aparece",
      "como cadastrar um ponto de coleta",
      "quero indicar um lugar de coleta",
      "como incluir um novo local no mapa",
    ],
  },
  {
    nome: "ajuda_cadastrar_material",
    descricao: "Como cadastrar um material no catálogo",
    exemplos: [
      "como cadastrar um novo item",
      "como adiciono um material ao catálogo",
      "passo a passo para cadastrar material",
      "como faço para incluir um material",
      "como coloco foto no material",
      "como funciona o cadastro de materiais",
    ],
  },
  {
    nome: "ajuda_ecopontos",
    descricao: "Como funcionam EcoPontos, níveis e missão",
    exemplos: [
      "como funcionam os ecopontos",
      "como ganho pontos",
      "quantos pontos vale cada material",
      "como subo de nível",
      "quais são os níveis",
      "o que são ecopontos",
      "como funciona a missão do dia",
      "como funciona a pontuação",
      "por que eletrônico vale mais",
    ],
  },
  {
    nome: "ajuda_conquistas",
    descricao: "Como funcionam as conquistas e o ranking",
    exemplos: [
      "como desbloquear conquistas",
      "quais conquistas existem",
      "como funciona o ranking",
      "o que são as medalhas",
      "como aparecer no ranking",
      "como ganhar a conquista mapeador",
    ],
  },
  {
    nome: "ajuda_limite",
    descricao: "Limite diário e pontos não recebidos",
    exemplos: [
      "por que não ganhei pontos",
      "não consigo registrar mais descartes",
      "existe limite de descartes",
      "apareceu limite diário atingido",
      "meus pontos não entraram",
      "por que o ponto não aceita meu material",
    ],
  },
  {
    nome: "ajuda_localizacao",
    descricao: "Como usar a localização e traçar rota",
    exemplos: [
      "o botão perto de mim não funciona",
      "como permitir a localização",
      "como encontrar o ponto mais perto",
      "como traço a rota até o ponto",
      "localização negada",
      "como chego até o ecoponto",
      "o mapa não mostra onde eu estou",
    ],
  },
  {
    nome: "ajuda_favoritos",
    descricao: "Como usar os favoritos",
    exemplos: [
      "como favoritar um material",
      "para que servem os favoritos",
      "como salvar um material",
      "onde vejo meus materiais salvos",
      "como tirar algo dos favoritos",
    ],
  },
  {
    nome: "ajuda_conta",
    descricao: "Criar conta, entrar e sair",
    exemplos: [
      "como criar uma conta",
      "como faço login",
      "esqueci minha senha",
      "como sair da conta",
      "preciso de conta para usar",
      "como me cadastrar na plataforma",
      "não consigo entrar",
    ],
  },
  {
    nome: "ajuda_separacao",
    descricao: "Como separar e preparar um material",
    exemplos: [
      "como separar o lixo",
      "como descartar vidro quebrado",
      "pilha pode ir no lixo comum",
      "precisa lavar a embalagem",
      "como preparar o papelão",
      "casca de fruta é reciclável",
      "como descarto isopor",
      "o que fazer com lata de tinta",
      "papel engordurado recicla",
      "tampinha vai junto com a garrafa",
    ],
  },
  {
    nome: "ajuda_tipos_ponto",
    descricao: "Diferença entre ecoponto, PEV, cooperativa e parceiro",
    exemplos: [
      "o que é um pev",
      "o que é ecoponto",
      "qual a diferença entre ecoponto e pev",
      "o que significa ponto verificado",
      "o que é uma cooperativa de reciclagem",
      "o que são pontos parceiros",
      "o que quer dizer o selo comunidade",
    ],
  },
  {
    nome: "sobre_reuse",
    descricao: "O que é a plataforma ReUse!",
    exemplos: [
      "o que é o reuse",
      "para que serve essa plataforma",
      "quem fez o reuse",
      "como o reuse funciona",
      "qual o objetivo do site",
    ],
  },
  {
    nome: "o_que_voce_faz",
    descricao: "Menu de ajuda do assistente",
    exemplos: [
      "ajuda",
      "o que você faz",
      "o que você sabe fazer",
      "menu",
      "quais comandos existem",
      "me ajuda",
      "como você pode me ajudar",
      "opções",
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// 3) CONVERSA
// ---------------------------------------------------------------------------------------------

const conversa: Intencao[] = [
  {
    nome: "saudacao",
    descricao: "Cumprimentos",
    exemplos: ["oi", "olá", "bom dia", "boa tarde", "boa noite", "e aí", "oi eco", "tudo bem"],
  },
  {
    nome: "agradecimento",
    descricao: "Agradecimentos",
    exemplos: ["obrigado", "valeu", "muito obrigada", "brigado", "ajudou muito", "perfeito, obrigado"],
  },
  {
    nome: "despedida",
    descricao: "Despedidas",
    exemplos: ["tchau", "até mais", "falou", "até logo", "encerrar conversa", "até amanhã"],
  },
];

export const INTENCOES: Intencao[] = [...tarefas, ...orientacoes, ...conversa];
