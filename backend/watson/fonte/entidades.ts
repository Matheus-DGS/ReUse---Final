// Entidades (@entities) do assistente Eco: os "parâmetros" que o Watson extrai das frases.
// Os valores das categorias batem com o enum Categoria do Prisma, então chegam prontos ao backend.

export type ValorEntidade = { valor: string; sinonimos: string[] };
export type Entidade = { nome: string; descricao: string; valores: ValorEntidade[] };

export const ENTIDADES: Entidade[] = [
  {
    nome: "material",
    descricao: "Categoria de material reciclável (enum Categoria)",
    valores: [
      {
        valor: "PAPEL",
        sinonimos: ["papel", "papelão", "papelao", "caixa de papelão", "jornal", "revista", "caderno", "folhas", "papéis"],
      },
      {
        valor: "PLASTICO",
        sinonimos: ["plástico", "plastico", "plásticos", "garrafa pet", "pet", "sacola plástica", "embalagem plástica", "pote plástico", "garrafas pet", "isopor"],
      },
      {
        valor: "VIDRO",
        sinonimos: ["vidro", "vidros", "garrafa de vidro", "garrafas de vidro", "pote de vidro", "potes de vidro", "vidro quebrado", "frasco de vidro"],
      },
      {
        valor: "METAL",
        sinonimos: ["metal", "metais", "lata", "latas", "latinha", "latinhas", "alumínio", "aluminio", "aço", "tampinha", "lata de tinta"],
      },
      {
        valor: "ORGANICO",
        sinonimos: ["orgânico", "organico", "orgânicos", "restos de comida", "resto de comida", "casca", "cascas", "casca de fruta", "borra de café", "restos de alimentos", "compostagem"],
      },
      {
        valor: "ELETRONICO",
        sinonimos: ["eletrônico", "eletronico", "eletrônicos", "eletronicos", "pilha", "pilhas", "bateria", "baterias", "celular", "celular velho", "carregador", "cabo", "cabos", "e-lixo", "lixo eletrônico", "computador", "notebook"],
      },
      {
        // Usado na busca de pontos: "qualquer material" = sem filtro
        valor: "TODOS",
        sinonimos: ["qualquer material", "qualquer um", "todos os materiais", "tanto faz"],
      },
    ],
  },
  {
    nome: "pagina",
    descricao: "Páginas da plataforma (usadas no comando de navegação)",
    valores: [
      { valor: "mapa", sinonimos: ["mapa", "pontos de coleta", "pontos", "mapa de pontos"] },
      { valor: "ranking", sinonimos: ["ranking", "classificação", "placar"] },
      { valor: "perfil", sinonimos: ["perfil", "meu perfil", "meu impacto", "impacto"] },
      { valor: "favoritos", sinonimos: ["favoritos", "meus favoritos"] },
      { valor: "materiais", sinonimos: ["catálogo", "catalogo", "materiais", "catálogo de materiais"] },
      { valor: "sugerir_ponto", sinonimos: ["sugerir ponto", "novo ponto", "sugerir um ponto", "tela de sugerir ponto"] },
      { valor: "cadastrar_material", sinonimos: ["formulário de novo material", "formulário de material", "tela de cadastro de material"] },
      { valor: "inicio", sinonimos: ["início", "inicio", "página inicial", "pagina inicial", "home"] },
      { valor: "login", sinonimos: ["login", "página de login", "entrar na conta"] },
      { valor: "cadastro", sinonimos: ["criar conta", "cadastro de conta", "página de cadastro"] },
    ],
  },
  {
    nome: "ponto",
    descricao: "Pontos de coleta conhecidos (nome ou bairro). Pontos novos são resolvidos pelo backend.",
    valores: [
      { valor: "Ecoponto Vila Mariana", sinonimos: ["vila mariana", "ecoponto vila mariana"] },
      { valor: "PEV Estação Paulista", sinonimos: ["paulista", "estação paulista", "pev paulista", "avenida paulista"] },
      { valor: "Cooperativa Recicla Mooca", sinonimos: ["mooca", "recicla mooca", "cooperativa da mooca"] },
      { valor: "TecVerde — Coleta de Eletrônicos", sinonimos: ["tecverde", "tec verde", "consolação"] },
      { valor: "Composteira Comunitária Pinheiros", sinonimos: ["pinheiros", "composteira", "composteira de pinheiros"] },
      { valor: "Ecoponto Lapa", sinonimos: ["lapa", "ecoponto lapa"] },
      { valor: "PEV Santana", sinonimos: ["santana", "pev santana"] },
      { valor: "Ecoponto Tatuapé", sinonimos: ["tatuapé", "tatuape", "ecoponto tatuapé"] },
      { valor: "Cooperativa Butantã Sustentável", sinonimos: ["butantã", "butanta", "cooperativa do butantã"] },
      { valor: "PEV Museu do Ipiranga", sinonimos: ["ipiranga", "museu do ipiranga"] },
      { valor: "Compostagem da Feira da Liberdade", sinonimos: ["liberdade", "feira da liberdade"] },
      { valor: "Descarte Tech Itaim", sinonimos: ["itaim", "itaim bibi", "descarte tech"] },
      { valor: "PEV Parque da Aclimação", sinonimos: ["aclimação", "aclimacao", "parque da aclimação"] },
      { valor: "Ecoponto Barra Funda", sinonimos: ["barra funda", "ecoponto barra funda"] },
      { valor: "Coleta aberta do Condomínio Solar", sinonimos: ["perdizes", "condomínio solar"] },
      { valor: "Mercado Verde Bom Retiro", sinonimos: ["bom retiro", "mercado verde"] },
    ],
  },
  {
    nome: "item",
    descricao: "Materiais do catálogo (itens). Itens novos são resolvidos pelo backend.",
    valores: [
      { valor: "Garrafas PET", sinonimos: ["garrafa pet", "garrafas pet", "pet"] },
      { valor: "Caixas de papelão", sinonimos: ["caixa de papelão", "caixas de papelão", "papelão"] },
      { valor: "Potes de vidro", sinonimos: ["pote de vidro", "potes de vidro"] },
      { valor: "Latas de alumínio", sinonimos: ["lata de alumínio", "latas de alumínio", "latas", "latinha"] },
      { valor: "Cascas e restos de alimentos", sinonimos: ["cascas", "restos de alimentos", "restos de comida"] },
      { valor: "Pilhas e baterias", sinonimos: ["pilhas", "pilha", "baterias", "bateria"] },
    ],
  },
  {
    nome: "tipo_ponto",
    descricao: "Tipos de ponto de coleta",
    valores: [
      { valor: "ECOPONTO", sinonimos: ["ecoponto", "ecopontos"] },
      { valor: "PEV", sinonimos: ["pev", "pevs", "ponto de entrega voluntária"] },
      { valor: "COOPERATIVA", sinonimos: ["cooperativa", "cooperativas"] },
      { valor: "PARCEIRO", sinonimos: ["parceiro", "parceiros", "ponto parceiro"] },
      { valor: "SELO", sinonimos: ["verificado", "selo comunidade", "comunidade", "selo"] },
    ],
  },
];
