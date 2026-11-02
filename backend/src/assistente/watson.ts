// Cliente do IBM watsonx Assistant (antigo Watson Assistant) — API v2, endpoint stateless.
// Documentação: https://cloud.ibm.com/apidocs/assistant-v2
//
// Variáveis de ambiente:
//   WATSON_APIKEY          → API key da instância (IBM Cloud → Resource list → Assistant → Credentials)
//   WATSON_URL             → URL da instância, ex.: https://api.au-syd.assistant.watson.cloud.ibm.com/instances/<id>
//   WATSON_ENVIRONMENT_ID  → ID do ambiente (Assistant settings → Environments). Também aceita WATSON_ASSISTANT_ID.

import type { SaidaMotor } from "./motor";

const VERSAO_API = "2021-11-27";
const TEMPO_LIMITE_MS = 8000;

function configuracao() {
  return {
    apikey: process.env.WATSON_APIKEY,
    url: process.env.WATSON_URL?.replace(/\/+$/, ""),
    ambiente: process.env.WATSON_ENVIRONMENT_ID || process.env.WATSON_ASSISTANT_ID,
  };
}

export function watsonConfigurado() {
  const { apikey, url, ambiente } = configuracao();
  return Boolean(apikey && url && ambiente);
}

// O token IAM dura ~1h: guardamos em memória e renovamos um minuto antes de expirar.
let tokenEmCache: { valor: string; expiraEm: number } | null = null;

async function tokenIam(apikey: string) {
  if (tokenEmCache && tokenEmCache.expiraEm > Date.now() + 60_000) return tokenEmCache.valor;

  const resposta = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "urn:ibm:params:oauth:grant-type:apikey", apikey }),
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
  });
  if (!resposta.ok) throw new Error(`IAM respondeu ${resposta.status}`);

  const dados = (await resposta.json()) as { access_token: string; expires_in: number };
  tokenEmCache = { valor: dados.access_token, expiraEm: Date.now() + dados.expires_in * 1000 };
  return dados.access_token;
}

type RespostaWatson = {
  output?: {
    generic?: SaidaMotor["generic"];
    intents?: { intent: string; confidence: number }[];
  };
  context?: unknown;
};

export async function conversarComWatson(texto: string, contexto: unknown, usuarioId: string | null): Promise<SaidaMotor> {
  const { apikey, url, ambiente } = configuracao();
  if (!apikey || !url || !ambiente) throw new Error("IBM Watson não configurado");

  const token = await tokenIam(apikey);
  const resposta = await fetch(`${url}/v2/assistants/${ambiente}/message?version=${VERSAO_API}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { message_type: "text", text: texto },
      // No endpoint stateless o estado do diálogo trafega no contexto, devolvido a cada resposta
      ...(isContextoWatson(contexto) ? { context: contexto } : {}),
      user_id: usuarioId ?? "visitante",
    }),
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
  });

  if (!resposta.ok) {
    if (resposta.status === 401) tokenEmCache = null;
    throw new Error(`Watson respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 200)}`);
  }

  const dados = (await resposta.json()) as RespostaWatson;
  const topo = dados.output?.intents?.[0];
  return {
    generic: dados.output?.generic ?? [],
    contexto: dados.context ?? null,
    intencao: topo ? { nome: topo.intent, confianca: topo.confidence } : null,
    motor: "watson",
  };
}

/** O contexto do Watson tem "skills"/"global"; o do motor local tem motor: "local". */
function isContextoWatson(contexto: unknown): contexto is Record<string, unknown> {
  return Boolean(contexto && typeof contexto === "object" && ("skills" in contexto || "global" in contexto));
}
