// Tipos compartilhados entre o backend do assistente e o widget de chat.
// Este arquivo não importa nada do servidor, então pode ser usado em Client Components.

/** Ação executada diretamente pelo backend quando o usuário clica em um botão do chat. */
export type AcaoDireta = { nome: string; params: Record<string, unknown> };

export type Cartao = {
  titulo: string;
  subtitulo?: string;
  detalhe?: string;
  cores?: string[];
  href?: string;
  rotuloLink?: string;
  linkExterno?: { rotulo: string; href: string };
};

export type Bloco =
  | { tipo: "texto"; texto: string }
  | { tipo: "opcoes"; titulo?: string; opcoes: { rotulo: string; texto: string }[] }
  | { tipo: "cartoes"; cartoes: Cartao[] }
  | { tipo: "botoes"; botoes: { rotulo: string; acao: AcaoDireta; destaque?: boolean }[] }
  | { tipo: "confirmacao"; texto: string; confirmar: { rotulo: string; acao: AcaoDireta }; cancelarRotulo?: string }
  | { tipo: "links"; links: { rotulo: string; href: string }[] }
  | { tipo: "pedirLocalizacao"; texto: string; acao: AcaoDireta }
  | { tipo: "progresso"; titulo: string; valor: number; legenda: string }
  | {
      tipo: "celebracao";
      pontos: number;
      titulo: string;
      extrato: { rotulo: string; pontos: number }[];
      conquistas: string[];
    };

export type Efeitos = {
  /** Caminho para onde o widget deve navegar */
  navegar?: string;
  /** Pede ao Next.js para recarregar os dados da página (ex.: EcoPontos no cabeçalho) */
  atualizar?: boolean;
};

export type Localizacao = { latitude: number; longitude: number };

export type RequisicaoAssistente = {
  texto?: string;
  contexto?: unknown;
  acao?: AcaoDireta;
  localizacao?: Localizacao | null;
};

export type RespostaAssistente = {
  blocos: Bloco[];
  contexto: unknown;
  efeitos: Efeitos;
  motor: "watson" | "local" | "acao";
  intencao?: { nome: string; confianca: number } | null;
};
