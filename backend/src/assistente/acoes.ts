// Executor de tarefas do assistente Eco.
//
// O IBM Watson entende a frase e devolve uma resposta "user_defined" com a ação e os parâmetros
// (ex.: { acao: "registrar_descarte", categoria: "VIDRO", quantidade: 2, ponto: "vila mariana" }).
// Aqui essa ação é executada de verdade no banco, sempre em nome do usuário autenticado.
// Ações que gravam dados passam antes por um bloco de confirmação no chat.

import { prisma } from "@/lib/prisma";
import { CATEGORIAS, ehCategoria, type CategoriaKey } from "@/dominio/categorias";
import { TIPOS_PONTO, linkRota } from "@/dominio/pontos";
import { distanciaKm, formatarDistancia, tempoRelativo } from "@/dominio/geo";
import {
  CONQUISTAS,
  PONTOS_MATERIAL_CATALOGO,
  PONTOS_POR_CATEGORIA,
  QUANTIDADE_MAXIMA,
  inicioDoDiaSP,
  missaoDoDia,
} from "@/dominio/gamificacao";
import { estatisticasDoUsuario, rankingDeUsuarios } from "@/services/impacto";
import { MINUTOS_PARA_DESFAZER, registrarDescarteDoUsuario, ultimoDescarteDesfazivel } from "@/services/descartes";
import { ENTIDADES } from "../../watson/fonte/entidades";
import { resolverPorNome } from "./resolver";
import type { AcaoDireta, Bloco, Cartao, Efeitos, Localizacao } from "./tipos";

type Usuario = { id: string; nome: string } | null;

export type ResultadoAcao = { blocos: Bloco[]; efeitos?: Efeitos };

type Execucao = {
  usuario: Usuario;
  localizacao: Localizacao | null;
  paginaAtual?: string;
};

/** Variáveis de slot que devem ser limpas do contexto após executar cada ação. */
export const VARIAVEIS_POR_ACAO: Record<string, string[]> = {
  registrar_descarte: ["categoria", "quantidade", "ponto", "cancelado"],
  buscar_ponto: ["material_busca", "cancelado"],
  cadastrar_material: ["nome_material", "categoria_material", "descricao_material", "cancelado"],
  favoritar_material: ["item_favorito", "cancelado"],
  remover_favorito: ["item_remover", "cancelado"],
};

// ------------------------------------------------------------------ utilitários

const texto = (t: string): Bloco => ({ tipo: "texto", texto: t });
const rotuloMaterial = (c: CategoriaKey) => CATEGORIAS[c].label.toLowerCase();
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function precisaEntrar(paginaAtual = "/", motivo: string): ResultadoAcao {
  const destino = encodeURIComponent(paginaAtual);
  return {
    blocos: [
      texto(`🔒 Para ${motivo}, você precisa **entrar na sua conta**. É rapidinho!`),
      {
        tipo: "links",
        links: [
          { rotulo: "Entrar", href: `/login?redirecionar=${destino}` },
          { rotulo: "Criar conta", href: `/cadastro?redirecionar=${destino}` },
        ],
      },
    ],
  };
}

function categoriaDe(valor: unknown): CategoriaKey | null {
  return ehCategoria(valor) ? valor : null;
}

async function pontosQueAceitam(categoria: CategoriaKey | null, localizacao: Localizacao | null, limite = 3) {
  const pontos = await prisma.pontoColeta.findMany({
    where: categoria ? { materiais: { has: categoria } } : undefined,
    include: { _count: { select: { descartes: true } } },
  });
  const comDistancia = pontos.map((p) => ({ ...p, distancia: localizacao ? distanciaKm(localizacao, p) : null }));
  comDistancia.sort((a, b) =>
    a.distancia !== null && b.distancia !== null
      ? a.distancia - b.distancia
      : Number(b.verificado) - Number(a.verificado) || b._count.descartes - a._count.descartes
  );
  return comDistancia.slice(0, limite);
}

function cartaoPonto(p: Awaited<ReturnType<typeof pontosQueAceitam>>[number]): Cartao {
  return {
    titulo: p.nome,
    subtitulo: `${TIPOS_PONTO[p.tipo].label}${p.distancia !== null ? ` · a ${formatarDistancia(p.distancia)}` : ""} · ${p.bairro}`,
    detalhe: p.horario,
    cores: p.materiais.map((m) => CATEGORIAS[m].cor),
    href: `/pontos/${p.id}`,
    rotuloLink: "Ver ponto",
    linkExterno: { rotulo: "Rota ↗", href: linkRota(p.latitude, p.longitude) },
  };
}

async function candidatosDePonto() {
  const pontos = await prisma.pontoColeta.findMany({
    select: { id: true, nome: true, bairro: true, materiais: true },
  });
  const apelidos = ENTIDADES.find((e) => e.nome === "ponto")?.valores ?? [];
  return pontos.map((p) => ({
    ...p,
    extras: [p.bairro, ...(apelidos.find((a) => a.valor === p.nome)?.sinonimos ?? [])],
  }));
}

function apelidosDeItem(nome: string) {
  return ENTIDADES.find((e) => e.nome === "item")?.valores.find((v) => v.valor === nome)?.sinonimos ?? [];
}

// ------------------------------------------------------------------ ações vindas do Watson

export async function executarAcaoDoWatson(
  dados: Record<string, unknown>,
  exec: Execucao
): Promise<ResultadoAcao> {
  // Tarefa cancelada pelo usuário no meio do preenchimento: o Watson já respondeu
  if (dados.cancelado === true || dados.cancelado === "true") return { blocos: [] };

  switch (dados.acao) {
    case "registrar_descarte":
      return prepararDescarte(dados, exec);
    case "buscar_ponto":
      return buscarPontos(categoriaDe(dados.categoria), exec);
    case "desfazer_descarte":
      return prepararDesfazer(exec);
    case "consultar_impacto":
      return consultarImpacto(exec);
    case "missao_do_dia":
      return consultarMissao(exec);
    case "consultar_ranking":
      return consultarRanking(exec);
    case "historico_descartes":
      return consultarHistorico(exec);
    case "favoritar_material":
      return favoritarPorTexto(String(dados.item ?? ""), exec);
    case "listar_favoritos":
      return listarFavoritos(exec);
    case "remover_favorito":
      return removerFavoritoPorTexto(String(dados.item ?? ""), exec);
    case "cadastrar_material":
      return prepararCadastroMaterial(dados, exec);
    case "navegar":
      return navegar(String(dados.pagina ?? ""));
    default:
      return { blocos: [texto("Ainda não sei executar essa tarefa. 😅")] };
  }
}

// ------------------------------------------------------------------ ações diretas (botões do chat)

export async function executarAcaoDireta(acao: AcaoDireta, exec: Execucao): Promise<ResultadoAcao> {
  const p = acao.params;
  switch (acao.nome) {
    case "confirmar_descarte":
      return confirmarDescarte(String(p.pontoId), categoriaDe(p.categoria), Number(p.quantidade), exec);
    case "confirmar_desfazer":
      return confirmarDesfazer(String(p.descarteId), exec);
    case "buscar_ponto":
      return buscarPontos(categoriaDe(p.categoria), exec);
    case "favoritar_item":
      return favoritarItem(String(p.itemId), exec);
    case "confirmar_remover_favorito":
      return removerFavorito(String(p.itemId), exec);
    case "confirmar_cadastro_material":
      return confirmarCadastroMaterial(p, exec);
    default:
      return { blocos: [texto("Essa ação não está disponível.")] };
  }
}

// ------------------------------------------------------------------ registrar / desfazer descarte

async function prepararDescarte(dados: Record<string, unknown>, exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "registrar descartes e ganhar EcoPontos");

  const categoria = categoriaDe(dados.categoria);
  if (!categoria) {
    return {
      blocos: [
        texto("Para registrar, preciso de **um material específico**. Qual deles você descartou?"),
        {
          tipo: "opcoes",
          opcoes: (Object.keys(CATEGORIAS) as CategoriaKey[]).map((c) => ({
            rotulo: CATEGORIAS[c].label,
            texto: `registrar descarte de ${rotuloMaterial(c)}`,
          })),
        },
      ],
    };
  }

  const quantidade = Math.round(Number(dados.quantidade));
  if (!Number.isFinite(quantidade) || quantidade < 1 || quantidade > QUANTIDADE_MAXIMA) {
    return {
      blocos: [
        texto(`Consigo registrar de **1 a ${QUANTIDADE_MAXIMA} volumes** por vez. Se trouxe mais, faça registros separados. Vamos tentar de novo?`),
        { tipo: "opcoes", opcoes: [{ rotulo: "Registrar descarte", texto: "quero registrar um descarte" }] },
      ],
    };
  }

  const candidatos = await candidatosDePonto();
  const resolucao = resolverPorNome(String(dados.ponto ?? ""), candidatos);
  const previa = PONTOS_POR_CATEGORIA[categoria] * quantidade;
  const resumo = `**${plural(quantidade, "volume", "volumes")} de ${rotuloMaterial(categoria)}**`;

  const botoesAlternativos = async (mensagem: string): Promise<ResultadoAcao> => {
    const alternativas = await pontosQueAceitam(categoria, exec.localizacao);
    return {
      blocos: [
        texto(mensagem),
        {
          tipo: "botoes",
          botoes: alternativas.map((p) => ({
            rotulo: `Registrar em ${p.nome}${p.distancia !== null ? ` (${formatarDistancia(p.distancia)})` : ""}`,
            acao: { nome: "confirmar_descarte", params: { pontoId: p.id, categoria, quantidade } },
          })),
        },
        { tipo: "links", links: [{ rotulo: "Ver todos no mapa", href: `/pontos?material=${categoria}` }] },
      ],
    };
  };

  if (resolucao.tipo === "nenhum") {
    return botoesAlternativos(
      `Não encontrei esse ponto de coleta. 🤔 Estes pontos recebem ${rotuloMaterial(categoria)}. Toque em um deles para registrar ${resumo}:`
    );
  }

  if (resolucao.tipo === "varios") {
    return {
      blocos: [
        texto(`Encontrei mais de um ponto com esse nome. Em qual deles você deixou ${resumo}?`),
        {
          tipo: "botoes",
          botoes: resolucao.itens.map((p) => ({
            rotulo: `${p.nome} · ${p.bairro}`,
            acao: { nome: "confirmar_descarte", params: { pontoId: p.id, categoria, quantidade } },
          })),
        },
      ],
    };
  }

  const ponto = resolucao.item;
  if (!ponto.materiais.includes(categoria)) {
    return botoesAlternativos(
      `O **${ponto.nome}** não recebe ${rotuloMaterial(categoria)}. 😕 Você quis dizer algum destes pontos?`
    );
  }

  return {
    blocos: [
      {
        tipo: "confirmacao",
        texto: `Confirma o registro de ${resumo} no **${ponto.nome}**? Você ganha **+${previa} EcoPontos**, mais os bônus que se aplicarem.`,
        confirmar: {
          rotulo: "Confirmar registro",
          acao: { nome: "confirmar_descarte", params: { pontoId: ponto.id, categoria, quantidade } },
        },
      },
    ],
  };
}

async function confirmarDescarte(
  pontoId: string,
  categoria: CategoriaKey | null,
  quantidade: number,
  exec: Execucao
): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "registrar descartes");

  const resultado = await registrarDescarteDoUsuario(exec.usuario.id, { pontoId, categoria, quantidade });
  if (resultado.status === "erro") return { blocos: [texto(`⚠️ ${resultado.mensagem}`)] };

  const base = resultado.pontosGanhos - resultado.bonus.reduce((s, b) => s + b.pontos, 0);
  return {
    blocos: [
      {
        tipo: "celebracao",
        pontos: resultado.pontosGanhos,
        titulo: resultado.subiuDeNivel ? `Você subiu para ${resultado.nivelDepois}!` : "Descarte registrado!",
        extrato: [{ rotulo: "Descarte", pontos: base }, ...resultado.bonus.map((b) => ({ rotulo: b.rotulo, pontos: b.pontos }))],
        conquistas: resultado.novasConquistas.map((c) => `${c.simbolo} ${c.titulo}`),
      },
      texto(
        `Agora você tem **${resultado.totalPontos} EcoPontos** no nível **${resultado.nivelDepois}**.` +
          (resultado.proximoNivel ? ` Faltam ${resultado.faltam} para ${resultado.proximoNivel}.` : "") +
          `\n\nRegistrou errado? Diga *“desfazer meu último descarte”* em até ${MINUTOS_PARA_DESFAZER} minutos.`
      ),
    ],
    efeitos: { atualizar: true },
  };
}

async function prepararDesfazer(exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "gerenciar seus descartes");

  const ultimo = await ultimoDescarteDesfazivel(exec.usuario.id);
  if (!ultimo) {
    return {
      blocos: [
        texto(`Não encontrei descartes registrados nos últimos **${MINUTOS_PARA_DESFAZER} minutos**. Só é possível desfazer registros recentes, para manter o ranking justo.`),
        { tipo: "opcoes", opcoes: [{ rotulo: "Ver meu histórico", texto: "meus últimos descartes" }] },
      ],
    };
  }

  return {
    blocos: [
      {
        tipo: "confirmacao",
        texto: `Desfazer o registro de **${plural(ultimo.quantidade, "volume", "volumes")} de ${rotuloMaterial(ultimo.categoria)}** no **${ultimo.ponto.nome}** (${tempoRelativo(ultimo.data)})? Os **${ultimo.pontos} EcoPontos** desse registro serão removidos.`,
        confirmar: { rotulo: "Desfazer registro", acao: { nome: "confirmar_desfazer", params: { descarteId: ultimo.id } } },
        cancelarRotulo: "Manter",
      },
    ],
  };
}

async function confirmarDesfazer(descarteId: string, exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "gerenciar seus descartes");

  const ultimo = await ultimoDescarteDesfazivel(exec.usuario.id);
  if (!ultimo || ultimo.id !== descarteId) {
    return { blocos: [texto("Esse registro não pode mais ser desfeito. Só é possível desfazer o descarte mais recente, em até 30 minutos.")] };
  }

  await prisma.descarte.delete({ where: { id: ultimo.id } });

  return {
    blocos: [texto(`↩️ Pronto! Desfiz o registro e removi **${ultimo.pontos} EcoPontos**. Você pode registrar o descarte correto quando quiser.`)],
    efeitos: { atualizar: true },
  };
}

// ------------------------------------------------------------------ busca de pontos

async function buscarPontos(categoria: CategoriaKey | null, exec: Execucao): Promise<ResultadoAcao> {
  const pontos = await pontosQueAceitam(categoria, exec.localizacao);
  const alvo = categoria ? `que recebem **${rotuloMaterial(categoria)}**` : "de coleta";
  const blocos: Bloco[] = [];

  if (pontos.length === 0) {
    blocos.push(texto(`Ainda não há pontos ${alvo} no mapa. Conhece algum? Você pode [sugerir um ponto](/pontos/novo).`));
    return { blocos };
  }

  blocos.push(
    texto(
      exec.localizacao
        ? `📍 Estes são os pontos ${alvo} **mais perto de você**:`
        : `Estes são os pontos ${alvo} mais movimentados:`
    ),
    { tipo: "cartoes", cartoes: pontos.map(cartaoPonto) }
  );

  if (!exec.localizacao) {
    blocos.push({
      tipo: "pedirLocalizacao",
      texto: "Quer ver os mais próximos de você?",
      acao: { nome: "buscar_ponto", params: { categoria } },
    });
  }

  if (categoria) blocos.push(texto(`💡 **Dica de preparo:** ${CATEGORIAS[categoria].dica}`));
  blocos.push({ tipo: "links", links: [{ rotulo: "Abrir no mapa", href: categoria ? `/pontos?material=${categoria}` : "/pontos" }] });

  return { blocos };
}

// ------------------------------------------------------------------ consultas

async function consultarImpacto(exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "ver seus EcoPontos e conquistas");

  const { estatisticas, nivel } = await estatisticasDoUsuario(exec.usuario.id);
  const conquistas = CONQUISTAS.filter((c) => c.atingiu(estatisticas));
  const proxima = CONQUISTAS.find((c) => !c.atingiu(estatisticas));

  return {
    blocos: [
      texto(
        `Olá, ${exec.usuario.nome.split(" ")[0]}! Você tem **${estatisticas.totalPontos} EcoPontos** e está no nível **${nivel.nome}** ${nivel.simbolo}.`
      ),
      {
        tipo: "progresso",
        titulo: `Nível ${nivel.nome}`,
        valor: nivel.progresso,
        legenda: nivel.proximo ? `Faltam ${nivel.faltam} EcoPontos para ${nivel.proximo.nome}` : "Nível máximo atingido!",
      },
      texto(
        `- **Descartes:** ${estatisticas.totalDescartes}\n- **Pontos visitados:** ${estatisticas.pontosVisitados}\n- **Conquistas:** ${conquistas.length} de ${CONQUISTAS.length}` +
          (proxima ? `\n\n🎯 **Próxima conquista:** ${proxima.titulo}. ${proxima.descricao}` : "")
      ),
      { tipo: "links", links: [{ rotulo: "Abrir Meu impacto", href: "/perfil" }] },
    ],
  };
}

async function consultarMissao(exec: Execucao): Promise<ResultadoAcao> {
  const missao = missaoDoDia();
  const material = rotuloMaterial(missao.categoria);
  const cumprida = exec.usuario
    ? (await prisma.descarte.count({
        where: { usuarioId: exec.usuario.id, categoria: missao.categoria, data: { gte: inicioDoDiaSP() } },
      })) > 0
    : false;

  return {
    blocos: [
      texto(
        cumprida
          ? `✅ A missão de hoje era **descartar ${material}** e você **já cumpriu**! Volte amanhã para uma nova missão.`
          : `🎯 **Missão do dia:** descarte **${material}** em qualquer ponto e ganhe **+${missao.bonus} EcoPontos** de bônus.\n\n💡 ${CATEGORIAS[missao.categoria].dica}`
      ),
      ...(cumprida
        ? []
        : [
            {
              tipo: "opcoes" as const,
              opcoes: [
                { rotulo: `Onde descartar ${material}?`, texto: `onde descartar ${material}` },
                { rotulo: "Já descartei, registrar", texto: `registrar descarte de ${material}` },
              ],
            },
          ]),
    ],
  };
}

async function consultarRanking(exec: Execucao): Promise<ResultadoAcao> {
  const ranking = await rankingDeUsuarios("geral", 1000);
  const medalhas = ["🥇", "🥈", "🥉"];
  const podio = ranking
    .slice(0, 3)
    .map((r, i) => `${medalhas[i]} **${r.nome}**: ${r.pontos} pts`)
    .join("\n");
  const minha = exec.usuario ? ranking.find((r) => r.usuarioId === exec.usuario!.id) : undefined;

  let sobreVoce = "";
  if (exec.usuario) {
    if (minha) {
      const acima = ranking[minha.posicao - 2];
      sobreVoce = `\n\nVocê está em **${minha.posicao}º lugar** com ${minha.pontos} EcoPontos.` +
        (acima ? ` Faltam **${acima.pontos - minha.pontos + 1} pontos** para ultrapassar **${acima.nome}** 💪` : " Você lidera o ranking! 🏆");
    } else {
      sobreVoce = "\n\nVocê ainda não pontuou. Registre seu primeiro descarte para entrar no ranking!";
    }
  }

  return {
    blocos: [
      texto(ranking.length ? `**Ranking geral de EcoPontos**\n\n${podio}${sobreVoce}` : "O ranking ainda está vazio. Seja a primeira pessoa a pontuar!"),
      { tipo: "links", links: [{ rotulo: "Ver ranking completo", href: "/ranking" }] },
    ],
  };
}

async function consultarHistorico(exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "ver seu histórico de descartes");

  const descartes = await prisma.descarte.findMany({
    where: { usuarioId: exec.usuario.id },
    orderBy: { data: "desc" },
    take: 5,
    include: { ponto: { select: { nome: true } } },
  });

  if (descartes.length === 0) {
    return {
      blocos: [
        texto("Você ainda não registrou nenhum descarte. Que tal começar hoje? 🌱"),
        { tipo: "opcoes", opcoes: [{ rotulo: "Achar ponto de coleta", texto: "onde descartar perto de mim" }] },
      ],
    };
  }

  const agora = new Date();
  const linhas = descartes
    .map((d) => `- **${plural(d.quantidade, "volume", "volumes")} de ${rotuloMaterial(d.categoria)}** no ${d.ponto.nome} · +${d.pontos} pts · ${tempoRelativo(d.data, agora)}`)
    .join("\n");

  return {
    blocos: [texto(`Seus últimos descartes:\n\n${linhas}`), { tipo: "links", links: [{ rotulo: "Ver tudo em Meu impacto", href: "/perfil" }] }],
  };
}

// ------------------------------------------------------------------ favoritos

async function favoritarPorTexto(textoItem: string, exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "salvar materiais nos favoritos");

  const itens = await prisma.item.findMany({ select: { id: true, nomeItem: true } });
  const resolucao = resolverPorNome(
    textoItem,
    itens.map((i) => ({ ...i, nome: i.nomeItem, extras: apelidosDeItem(i.nomeItem) }))
  );

  if (resolucao.tipo === "nenhum") {
    return {
      blocos: [
        texto(`Não encontrei **“${textoItem}”** no catálogo. Confira os materiais disponíveis ou cadastre um novo.`),
        { tipo: "links", links: [{ rotulo: "Abrir catálogo", href: "/materiais" }] },
        { tipo: "opcoes", opcoes: [{ rotulo: "Cadastrar material", texto: "quero cadastrar um material" }] },
      ],
    };
  }

  if (resolucao.tipo === "varios") {
    return {
      blocos: [
        texto("Encontrei mais de um material. Qual deles você quer favoritar?"),
        {
          tipo: "botoes",
          botoes: resolucao.itens.map((i) => ({ rotulo: `☆ ${i.nomeItem}`, acao: { nome: "favoritar_item", params: { itemId: i.id } } })),
        },
      ],
    };
  }

  return favoritarItem(resolucao.item.id, exec);
}

async function favoritarItem(itemId: string, exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "salvar materiais nos favoritos");

  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true, nomeItem: true } });
  if (!item) return { blocos: [texto("Esse material não existe mais no catálogo.")] };

  await prisma.favorito.upsert({
    where: { usuarioId_itemId: { usuarioId: exec.usuario.id, itemId: item.id } },
    update: {},
    create: { usuarioId: exec.usuario.id, itemId: item.id },
  });

  return {
    blocos: [
      texto(`⭐ Salvei **${item.nomeItem}** nos seus favoritos.`),
      { tipo: "links", links: [{ rotulo: "Ver favoritos", href: "/favoritos" }, { rotulo: "Abrir material", href: `/materiais/${item.id}` }] },
    ],
    efeitos: { atualizar: true },
  };
}

async function listarFavoritos(exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "ver seus favoritos");

  const favoritos = await prisma.favorito.findMany({
    where: { usuarioId: exec.usuario.id },
    orderBy: { dataFavorito: "desc" },
    include: { item: { select: { id: true, nomeItem: true, categoria: true } } },
  });

  if (favoritos.length === 0) {
    return {
      blocos: [
        texto("Sua lista de favoritos está vazia. Diga, por exemplo, *“favoritar garrafa pet”*."),
        { tipo: "links", links: [{ rotulo: "Explorar catálogo", href: "/materiais" }] },
      ],
    };
  }

  return {
    blocos: [
      texto(`Você tem **${plural(favoritos.length, "favorito", "favoritos")}**:`),
      {
        tipo: "cartoes",
        cartoes: favoritos.map((f) => ({
          titulo: f.item.nomeItem,
          subtitulo: CATEGORIAS[f.item.categoria].label,
          cores: [CATEGORIAS[f.item.categoria].cor],
          href: `/materiais/${f.item.id}`,
          rotuloLink: "Abrir",
        })),
      },
    ],
  };
}

async function removerFavoritoPorTexto(textoItem: string, exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "gerenciar seus favoritos");

  const favoritos = await prisma.favorito.findMany({
    where: { usuarioId: exec.usuario.id },
    include: { item: { select: { id: true, nomeItem: true } } },
  });
  const resolucao = resolverPorNome(
    textoItem,
    favoritos.map((f) => ({ id: f.item.id, nome: f.item.nomeItem, extras: apelidosDeItem(f.item.nomeItem) }))
  );

  if (resolucao.tipo === "nenhum") {
    return {
      blocos: [
        texto(favoritos.length ? `Não achei **“${textoItem}”** entre os seus favoritos.` : "Sua lista de favoritos está vazia."),
        ...(favoritos.length
          ? [
              {
                tipo: "botoes" as const,
                botoes: favoritos.map((f) => ({
                  rotulo: `Remover ${f.item.nomeItem}`,
                  acao: { nome: "confirmar_remover_favorito", params: { itemId: f.item.id } },
                })),
              },
            ]
          : []),
      ],
    };
  }

  const alvos = resolucao.tipo === "unico" ? [resolucao.item] : resolucao.itens;
  if (alvos.length === 1) return removerFavorito(alvos[0].id, exec);

  return {
    blocos: [
      texto("Qual deles você quer remover?"),
      {
        tipo: "botoes",
        botoes: alvos.map((a) => ({ rotulo: `Remover ${a.nome}`, acao: { nome: "confirmar_remover_favorito", params: { itemId: a.id } } })),
      },
    ],
  };
}

async function removerFavorito(itemId: string, exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "gerenciar seus favoritos");

  const favorito = await prisma.favorito.findUnique({
    where: { usuarioId_itemId: { usuarioId: exec.usuario.id, itemId } },
    include: { item: { select: { nomeItem: true } } },
  });
  if (!favorito) return { blocos: [texto("Esse material já não está nos seus favoritos.")] };

  await prisma.favorito.delete({ where: { id: favorito.id } });

  return {
    blocos: [
      texto(`Removi **${favorito.item.nomeItem}** dos seus favoritos.`),
      { tipo: "botoes", botoes: [{ rotulo: "↩️ Desfazer", acao: { nome: "favoritar_item", params: { itemId } } }] },
    ],
    efeitos: { atualizar: true },
  };
}

// ------------------------------------------------------------------ cadastro de material

function validarMaterial(dados: Record<string, unknown>) {
  const nome = String(dados.nome ?? "").trim();
  const descricao = String(dados.descricao ?? "").trim();
  const categoria = categoriaDe(dados.categoria);
  if (nome.length < 3) return { erro: "O nome do material precisa ter pelo menos 3 caracteres." };
  if (nome.length > 80) return { erro: "O nome ficou muito longo. Use até 80 caracteres." };
  if (!categoria) return { erro: "Escolha uma das 6 categorias: papel, plástico, vidro, metal, orgânico ou eletrônico." };
  if (descricao.length < 10) return { erro: "A descrição precisa ter pelo menos 10 caracteres, explicando como descartar o material." };
  return { nome, descricao: descricao.slice(0, 600), categoria };
}

async function prepararCadastroMaterial(dados: Record<string, unknown>, exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "cadastrar materiais no catálogo");

  const validado = validarMaterial(dados);
  if ("erro" in validado) {
    return {
      blocos: [
        texto(`⚠️ ${validado.erro}`),
        { tipo: "opcoes", opcoes: [{ rotulo: "Tentar de novo", texto: "quero cadastrar um material" }] },
      ],
    };
  }

  const existente = await prisma.item.findFirst({
    where: { nomeItem: { equals: validado.nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (existente) {
    return {
      blocos: [
        texto(`O material **${validado.nome}** já está no catálogo. 😉`),
        { tipo: "links", links: [{ rotulo: "Abrir material", href: `/materiais/${existente.id}` }] },
      ],
    };
  }

  return {
    blocos: [
      {
        tipo: "confirmacao",
        texto: `Vou cadastrar no catálogo:\n\n- **Nome:** ${validado.nome}\n- **Categoria:** ${CATEGORIAS[validado.categoria].label}\n- **Descrição:** ${validado.descricao}\n\nEstá tudo certo? Você ganha **+${PONTOS_MATERIAL_CATALOGO} EcoPontos**.`,
        confirmar: {
          rotulo: "Cadastrar material",
          acao: { nome: "confirmar_cadastro_material", params: validado },
        },
      },
    ],
  };
}

async function confirmarCadastroMaterial(params: Record<string, unknown>, exec: Execucao): Promise<ResultadoAcao> {
  if (!exec.usuario) return precisaEntrar(exec.paginaAtual, "cadastrar materiais no catálogo");

  const validado = validarMaterial(params);
  if ("erro" in validado) return { blocos: [texto(`⚠️ ${validado.erro}`)] };

  const item = await prisma.item.create({
    data: { nomeItem: validado.nome, descricao: validado.descricao, categoria: validado.categoria, usuarioId: exec.usuario.id },
  });

  return {
    blocos: [
      texto(`✅ **${item.nomeItem}** foi cadastrado no catálogo e você ganhou **+${PONTOS_MATERIAL_CATALOGO} EcoPontos**. Obrigado por contribuir!`),
      { tipo: "links", links: [{ rotulo: "Ver material", href: `/materiais/${item.id}` }] },
    ],
    efeitos: { atualizar: true },
  };
}

// ------------------------------------------------------------------ navegação

const PAGINAS: Record<string, { href: string; nome: string }> = {
  mapa: { href: "/pontos", nome: "o mapa de pontos de coleta" },
  ranking: { href: "/ranking", nome: "o ranking" },
  perfil: { href: "/perfil", nome: "Meu impacto" },
  favoritos: { href: "/favoritos", nome: "seus favoritos" },
  materiais: { href: "/materiais", nome: "o catálogo de materiais" },
  sugerir_ponto: { href: "/pontos/novo", nome: "a sugestão de ponto" },
  cadastrar_material: { href: "/materiais/novo", nome: "o cadastro de material" },
  inicio: { href: "/", nome: "a página inicial" },
  login: { href: "/login", nome: "a página de login" },
  cadastro: { href: "/cadastro", nome: "a criação de conta" },
};

function navegar(pagina: string): ResultadoAcao {
  const destino = PAGINAS[pagina];
  if (!destino) return { blocos: [texto("Não encontrei essa página.")] };
  return { blocos: [texto(`Abrindo ${destino.nome}… ➜`)], efeitos: { navegar: destino.href } };
}

