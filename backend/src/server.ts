// Servidor HTTP da API do ReUse! — Node.js + Express + Prisma + PostgreSQL.
//
// Sobe sozinho (deploy no Render) e é consumido pelo frontend Next.js publicado na Vercel.
// Autenticação por token JWT (Bearer), CORS restrito às origens configuradas.

import cors from "cors";
import express from "express";
import { prisma } from "@/lib/prisma";
import { tratadorDeErros } from "@/lib/http";
import { identificar } from "@/middleware/auth";
import { api } from "@/rotas";
import { CATEGORIAS } from "@/dominio/categorias";
import { TIPOS_PONTO } from "@/dominio/pontos";
import { NIVEIS, PONTOS_POR_CATEGORIA } from "@/dominio/gamificacao";

const PORTA = Number(process.env.PORT) || 4000;

const origens = (process.env.ORIGENS_PERMITIDAS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));
app.use(
  cors({
    // Sem Origin (curl, app mobile, server-to-server) e origens da lista passam; o resto é barrado.
    origin: (origin, callback) =>
      !origin || origens.includes(origin) || origens.includes("*")
        ? callback(null, true)
        : callback(new Error(`Origem não autorizada: ${origin}`)),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// Log enxuto de uma linha por requisição — ajuda a acompanhar os logs do Render
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - inicio}ms)`);
  });
  next();
});

app.use(identificar);

// Página de boas-vindas da API: serve como documentação rápida do deploy do backend
app.get("/", (_req, res) => {
  res.json({
    nome: "ReUse! API",
    versao: "3.0.0",
    descricao:
      "Backend da plataforma ReUse! — autenticação, catálogo de materiais, pontos de coleta, gamificação, assistente Eco e área administrativa.",
    documentacao: {
      saude: "GET /api/saude",
      referencias: "GET /api/referencias",
      publico: [
        "GET /api/pontos?material=VIDRO&tipo=ECOPONTO&lat=-23.56&lng=-46.65",
        "GET /api/pontos/:id",
        "GET /api/items?categoria=PLASTICO&q=garrafa",
        "GET /api/items/:id",
        "GET /api/ranking?periodo=mes&limite=10",
        "GET /api/missao",
        "GET /api/assistente",
      ],
      autenticacao: ["POST /api/auth/login", "POST /api/auth/register", "GET /api/auth/me"],
      comLogin: [
        "POST /api/pontos",
        "POST /api/items",
        "GET|POST|DELETE /api/favoritos",
        "POST /api/descartes",
        "DELETE /api/descartes/:id",
        "GET /api/impacto",
        "POST /api/assistente",
      ],
      administracao: [
        "GET /api/admin/painel",
        "GET /api/admin/pontos",
        "PATCH /api/admin/pontos/:id",
        "DELETE /api/admin/pontos/:id",
        "GET|PATCH|DELETE /api/admin/usuarios",
        "GET|DELETE /api/admin/itens",
        "GET|DELETE /api/admin/descartes",
      ],
    },
  });
});

// Usado pelo health check do Render e pela página de status do frontend
app.get("/api/saude", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, banco: "conectado", horario: new Date().toISOString() });
  } catch {
    res.status(503).json({ ok: false, banco: "indisponivel" });
  }
});

// Tabelas de domínio (categorias, tipos de ponto, níveis e pesos) para quem integrar com a API
app.get("/api/referencias", (_req, res) => {
  res.json({
    categorias: Object.entries(CATEGORIAS).map(([chave, c]) => ({
      chave,
      label: c.label,
      dica: c.dica,
      ecopontosPorVolume: PONTOS_POR_CATEGORIA[chave as keyof typeof PONTOS_POR_CATEGORIA],
    })),
    tiposDePonto: Object.entries(TIPOS_PONTO).map(([chave, t]) => ({ chave, ...t })),
    niveis: NIVEIS,
  });
});

app.use("/api", api);

app.use((_req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

app.use(tratadorDeErros);

const servidor = app.listen(PORTA, () => {
  console.log(`[api] ReUse! no ar em http://localhost:${PORTA}`);
  console.log(`[api] origens permitidas: ${origens.join(", ")}`);
});

// Encerramento limpo no deploy (o Render envia SIGTERM antes de trocar a versão)
for (const sinal of ["SIGINT", "SIGTERM"] as const) {
  process.on(sinal, () => {
    console.log(`[api] recebido ${sinal}, encerrando...`);
    servidor.close(() => prisma.$disconnect().finally(() => process.exit(0)));
  });
}
