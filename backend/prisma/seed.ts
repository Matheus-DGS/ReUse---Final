// Seed idempotente do ReUse!: pode rodar a cada deploy sem duplicar dados.
// Os pontos de coleta são dados de DEMONSTRAÇÃO para o projeto acadêmico.

import { PrismaClient, type Categoria, type Papel, type TipoPonto } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PONTOS_POR_CATEGORIA: Record<Categoria, number> = {
  PAPEL: 5,
  PLASTICO: 5,
  ORGANICO: 4,
  VIDRO: 8,
  METAL: 8,
  ELETRONICO: 15,
};

type PontoSeed = {
  id: string;
  nome: string;
  tipo: TipoPonto;
  descricao: string;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  horario: string;
  materiais: Categoria[];
  verificado?: boolean;
  criadoPor?: string; // e-mail
};

const RECICLAVEIS: Categoria[] = ["PAPEL", "PLASTICO", "VIDRO", "METAL"];
const HORARIO_ECOPONTO = "Seg a sáb, 6h às 22h · Dom e feriados, 6h às 18h";

const pontos: PontoSeed[] = [
  {
    id: "ponto-ecoponto-vila-mariana",
    nome: "Ecoponto Vila Mariana",
    tipo: "ECOPONTO",
    descricao:
      "Área pública com caçambas separadas por material. Recebe recicláveis, pequenos volumes de entulho e eletrônicos de pequeno porte.",
    endereco: "Rua Sena Madureira, 980",
    bairro: "Vila Mariana",
    latitude: -23.5906,
    longitude: -46.6341,
    horario: HORARIO_ECOPONTO,
    materiais: [...RECICLAVEIS, "ELETRONICO"],
  },
  {
    id: "ponto-pev-paulista",
    nome: "PEV Estação Paulista",
    tipo: "PEV",
    descricao:
      "Contêineres de coleta seletiva próximos à estação de metrô. Ideal para quem passa pela avenida no caminho do trabalho ou da faculdade.",
    endereco: "Av. Paulista, 1500",
    bairro: "Bela Vista",
    latitude: -23.5617,
    longitude: -46.6562,
    horario: "Todos os dias, 24 horas",
    materiais: RECICLAVEIS,
  },
  {
    id: "ponto-cooperativa-mooca",
    nome: "Cooperativa Recicla Mooca",
    tipo: "COOPERATIVA",
    descricao:
      "Cooperativa de catadores que faz a triagem e a venda dos recicláveis, gerando renda para mais de 30 famílias da região.",
    endereco: "Rua da Mooca, 2300",
    bairro: "Mooca",
    latitude: -23.5561,
    longitude: -46.5962,
    horario: "Seg a sex, 8h às 17h",
    materiais: RECICLAVEIS,
  },
  {
    id: "ponto-tecverde-consolacao",
    nome: "TecVerde — Coleta de Eletrônicos",
    tipo: "PARCEIRO",
    descricao:
      "Loja parceira com coletor de pilhas, baterias, celulares, cabos e pequenos eletrodomésticos. Os resíduos seguem para uma recicladora licenciada.",
    endereco: "Rua da Consolação, 2200",
    bairro: "Consolação",
    latitude: -23.5541,
    longitude: -46.6603,
    horario: "Seg a sex, 9h às 18h · Sáb, 9h às 13h",
    materiais: ["ELETRONICO", "METAL"],
  },
  {
    id: "ponto-composteira-pinheiros",
    nome: "Composteira Comunitária Pinheiros",
    tipo: "PARCEIRO",
    descricao:
      "Horta comunitária que recebe resíduos orgânicos crus (cascas, folhas e borra de café) para compostagem. Não aceita carnes nem laticínios.",
    endereco: "Rua dos Pinheiros, 820",
    bairro: "Pinheiros",
    latitude: -23.5664,
    longitude: -46.6858,
    horario: "Ter a dom, 7h às 12h",
    materiais: ["ORGANICO"],
  },
  {
    id: "ponto-ecoponto-lapa",
    nome: "Ecoponto Lapa",
    tipo: "ECOPONTO",
    descricao: "Ecoponto com baias cobertas para papel, plástico, vidro e metal, além de área para móveis velhos.",
    endereco: "Rua Guaicurus, 1100",
    bairro: "Lapa",
    latitude: -23.5232,
    longitude: -46.7028,
    horario: HORARIO_ECOPONTO,
    materiais: RECICLAVEIS,
  },
  {
    id: "ponto-pev-santana",
    nome: "PEV Santana",
    tipo: "PEV",
    descricao: "Conjunto de contêineres coloridos junto ao terminal de ônibus.",
    endereco: "Av. Cruzeiro do Sul, 3000",
    bairro: "Santana",
    latitude: -23.5013,
    longitude: -46.6249,
    horario: "Todos os dias, 24 horas",
    materiais: ["PAPEL", "PLASTICO", "METAL"],
  },
  {
    id: "ponto-ecoponto-tatuape",
    nome: "Ecoponto Tatuapé",
    tipo: "ECOPONTO",
    descricao: "Um dos maiores ecopontos da zona leste, com coletor específico para eletrônicos e lâmpadas.",
    endereco: "Rua Tuiuti, 1500",
    bairro: "Tatuapé",
    latitude: -23.5402,
    longitude: -46.5762,
    horario: HORARIO_ECOPONTO,
    materiais: [...RECICLAVEIS, "ELETRONICO"],
  },
  {
    id: "ponto-cooperativa-butanta",
    nome: "Cooperativa Butantã Sustentável",
    tipo: "COOPERATIVA",
    descricao: "Cooperativa que recebe recicláveis secos e oferece oficinas de educação ambiental aos sábados.",
    endereco: "Av. Corifeu de Azevedo Marques, 500",
    bairro: "Butantã",
    latitude: -23.5712,
    longitude: -46.7082,
    horario: "Seg a sáb, 8h às 16h",
    materiais: ["PAPEL", "PLASTICO", "METAL"],
  },
  {
    id: "ponto-pev-ipiranga",
    nome: "PEV Museu do Ipiranga",
    tipo: "PEV",
    descricao: "Contêineres para vidro, metal e plástico no entorno do parque.",
    endereco: "Rua dos Patriotas, 100",
    bairro: "Ipiranga",
    latitude: -23.5887,
    longitude: -46.6098,
    horario: "Todos os dias, 6h às 20h",
    materiais: ["VIDRO", "METAL", "PLASTICO"],
  },
  {
    id: "ponto-feira-liberdade",
    nome: "Compostagem da Feira da Liberdade",
    tipo: "PARCEIRO",
    descricao: "Nos dias de feira, a barraca da compostagem recolhe restos de frutas e verduras e embalagens plásticas limpas.",
    endereco: "Praça da Liberdade, s/n",
    bairro: "Liberdade",
    latitude: -23.5583,
    longitude: -46.6343,
    horario: "Sáb e dom, 8h às 14h",
    materiais: ["ORGANICO", "PLASTICO"],
  },
  {
    id: "ponto-descarte-tech-itaim",
    nome: "Descarte Tech Itaim",
    tipo: "PARCEIRO",
    descricao: "Totem de coleta de pilhas, baterias e celulares no hall de um centro comercial.",
    endereco: "Rua Joaquim Floriano, 600",
    bairro: "Itaim Bibi",
    latitude: -23.5852,
    longitude: -46.6788,
    horario: "Seg a sáb, 10h às 22h",
    materiais: ["ELETRONICO"],
  },
  {
    id: "ponto-pev-aclimacao",
    nome: "PEV Parque da Aclimação",
    tipo: "PEV",
    descricao: "Contêineres de coleta seletiva na entrada principal do parque.",
    endereco: "Rua Muniz de Souza, 1100",
    bairro: "Aclimação",
    latitude: -23.5718,
    longitude: -46.6302,
    horario: "Todos os dias, 5h às 20h",
    materiais: RECICLAVEIS,
  },
  {
    id: "ponto-ecoponto-barra-funda",
    nome: "Ecoponto Barra Funda",
    tipo: "ECOPONTO",
    descricao: "Ecoponto próximo ao Memorial da América Latina, com baias para recicláveis e eletrônicos.",
    endereco: "Rua Barra Funda, 800",
    bairro: "Barra Funda",
    latitude: -23.5262,
    longitude: -46.6679,
    horario: HORARIO_ECOPONTO,
    materiais: [...RECICLAVEIS, "ELETRONICO"],
  },
  {
    id: "ponto-comunidade-perdizes",
    nome: "Coleta aberta do Condomínio Solar",
    tipo: "PEV",
    descricao: "O condomínio deixa os coletores da portaria abertos para vizinhos. Orgânicos vão para a composteira do prédio.",
    endereco: "Rua Cardoso de Almeida, 1400",
    bairro: "Perdizes",
    latitude: -23.5371,
    longitude: -46.6781,
    horario: "Todos os dias, 7h às 21h",
    materiais: ["PAPEL", "PLASTICO", "ORGANICO"],
    verificado: false,
    criadoPor: "bruno@reuse.app",
  },
  {
    id: "ponto-comunidade-bom-retiro",
    nome: "Mercado Verde Bom Retiro",
    tipo: "PARCEIRO",
    descricao: "Mercadinho de bairro com caixa para pilhas e garrafas de vidro retornáveis.",
    endereco: "Rua José Paulino, 450",
    bairro: "Bom Retiro",
    latitude: -23.5272,
    longitude: -46.6392,
    horario: "Seg a sáb, 8h às 20h",
    materiais: ["ELETRONICO", "VIDRO"],
    verificado: false,
    criadoPor: "ana@reuse.app",
  },
];

const usuarios: { email: string; nome: string; papel?: Papel }[] = [
  // Conta usada na área administrativa (fase 06) — ver /admin no frontend
  { email: "admin@reuse.app", nome: "Administração ReUse", papel: "ADMIN" },
  { email: "equipe@reuse.app", nome: "Equipe ReUse" },
  { email: "ana@reuse.app", nome: "Ana Souza" },
  { email: "bruno@reuse.app", nome: "Bruno Lima" },
  { email: "carla@reuse.app", nome: "Carla Mendes" },
  { email: "diego@reuse.app", nome: "Diego Rocha" },
  { email: "elisa@reuse.app", nome: "Elisa Tanaka" },
];

const itens: {
  id: string;
  nomeItem: string;
  descricao: string;
  categoria: Categoria;
  foto?: string;
  autor: string;
}[] = [
  {
    id: "item-garrafas-pet",
    nomeItem: "Garrafas PET",
    descricao:
      "Garrafas plásticas de refrigerante e água. Devem ser lavadas, amassadas e ter a tampa retirada antes do descarte.",
    categoria: "PLASTICO",
    foto: "https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=800",
    autor: "equipe@reuse.app",
  },
  {
    id: "item-caixas-papelao",
    nomeItem: "Caixas de papelão",
    descricao: "Embalagens de papelão limpas e secas. Desmonte as caixas para otimizar o espaço de coleta.",
    categoria: "PAPEL",
    foto: "https://images.unsplash.com/photo-1607166452427-7e4477079cb9?w=800",
    autor: "equipe@reuse.app",
  },
  {
    id: "item-potes-vidro",
    nomeItem: "Potes de vidro",
    descricao: "Potes e garrafas de vidro sem rótulo. Evite descartar vidros quebrados junto com os demais materiais.",
    categoria: "VIDRO",
    autor: "equipe@reuse.app",
  },
  {
    id: "item-latas-aluminio",
    nomeItem: "Latas de alumínio",
    descricao: "Latas de bebida e conservas. Um dos materiais recicláveis de maior valor de reaproveitamento.",
    categoria: "METAL",
    autor: "equipe@reuse.app",
  },
  {
    id: "item-restos-alimentos",
    nomeItem: "Cascas e restos de alimentos",
    descricao:
      "Cascas de frutas, legumes, folhas e borra de café viram adubo na compostagem. Carnes, laticínios e óleo não devem ir para a composteira.",
    categoria: "ORGANICO",
    foto: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800",
    autor: "ana@reuse.app",
  },
  {
    id: "item-pilhas-baterias",
    nomeItem: "Pilhas e baterias",
    descricao:
      "Contêm metais pesados e jamais devem ir para o lixo comum. Guarde em um pote fechado e leve a um coletor de eletrônicos.",
    categoria: "ELETRONICO",
    autor: "carla@reuse.app",
  },
];

// Gerador pseudoaleatório determinístico (os mesmos dados a cada execução)
function aleatorio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

async function main() {
  const senhaHash = await bcrypt.hash("reuse123", 10);

  const idsUsuarios = new Map<string, string>();
  for (const { papel = "USUARIO", ...u } of usuarios) {
    const registro = await prisma.usuario.upsert({
      where: { email: u.email },
      // O papel é reaplicado a cada seed: o deploy sempre sobe com um administrador válido
      update: { papel },
      create: { ...u, papel, senha: senhaHash },
    });
    idsUsuarios.set(u.email, registro.id);
  }

  for (const { criadoPor, verificado = true, ...p } of pontos) {
    const dados = { ...p, verificado, criadoPorId: criadoPor ? idsUsuarios.get(criadoPor) : null };
    await prisma.pontoColeta.upsert({ where: { id: p.id }, update: dados, create: dados });
  }

  for (const { foto, autor, ...item } of itens) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        usuarioId: idsUsuarios.get(autor)!,
        fotos: foto ? { create: [{ urlFoto: foto, principal: true }] } : undefined,
      },
    });
  }

  // Histórico de descartes da comunidade — criado só na primeira execução
  const jaTemDescartes = await prisma.descarte.count({
    where: { usuarioId: { in: [...idsUsuarios.values()] } },
  });

  if (jaTemDescartes === 0) {
    const sortear = aleatorio(42);
    const agora = Date.now();
    const perfis: { email: string; quantidade: number; diasMin: number }[] = [
      { email: "ana@reuse.app", quantidade: 16, diasMin: 0 },
      { email: "bruno@reuse.app", quantidade: 12, diasMin: 0 },
      { email: "carla@reuse.app", quantidade: 9, diasMin: 1 },
      { email: "diego@reuse.app", quantidade: 6, diasMin: 2 },
      { email: "elisa@reuse.app", quantidade: 4, diasMin: 0 },
      // A conta de demonstração tem progresso, mas nada hoje: missão e limite diário ficam livres
      { email: "equipe@reuse.app", quantidade: 5, diasMin: 1 },
    ];

    const dados = [];
    for (const perfil of perfis) {
      const visitados = new Set<string>();
      for (let i = 0; i < perfil.quantidade; i++) {
        const ponto = pontos[Math.floor(sortear() * pontos.length)];
        const categoria = ponto.materiais[Math.floor(sortear() * ponto.materiais.length)];
        const quantidade = 1 + Math.floor(sortear() * 3);
        const dias = perfil.diasMin + Math.floor(sortear() * 24);
        const horas = 8 + Math.floor(sortear() * 12);
        let pontosGanhos = PONTOS_POR_CATEGORIA[categoria] * quantidade;
        if (!visitados.has(ponto.id)) {
          pontosGanhos += 10;
          visitados.add(ponto.id);
        }
        dados.push({
          usuarioId: idsUsuarios.get(perfil.email)!,
          pontoId: ponto.id,
          categoria,
          quantidade,
          pontos: pontosGanhos,
          data: new Date(agora - dias * 86_400_000 - horas * 3_600_000),
        });
      }
    }
    await prisma.descarte.createMany({ data: dados });
  }

  const [p, i, d] = await Promise.all([prisma.pontoColeta.count(), prisma.item.count(), prisma.descarte.count()]);
  console.log(`Seed concluído: ${p} pontos de coleta, ${i} materiais, ${d} descartes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
