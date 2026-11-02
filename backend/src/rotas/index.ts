// Mapa de rotas da API do ReUse!.

import { Router } from "express";
import { rotasAdmin } from "./admin";
import { rotasAssistente } from "./assistente";
import { rotasAuth } from "./auth";
import { rotasFavoritos } from "./favoritos";
import { rotasDescartes, rotasImpacto, rotasMissao, rotasRanking } from "./gamificacao";
import { rotasItens } from "./itens";
import { rotasPaginas } from "./paginas";
import { rotasPontos } from "./pontos";

export const api = Router();

api.use("/auth", rotasAuth);

// Recursos REST — públicos para leitura, usados pelo site e abertos a integrações
api.use("/pontos", rotasPontos);
api.use("/items", rotasItens);
api.use("/favoritos", rotasFavoritos);
api.use("/descartes", rotasDescartes);
api.use("/impacto", rotasImpacto);
api.use("/ranking", rotasRanking);
api.use("/missao", rotasMissao);

// ChatBot (fase 06) e área administrativa (fase 06)
api.use("/assistente", rotasAssistente);
api.use("/admin", rotasAdmin);

// Consultas agregadas por tela (BFF do frontend Next.js)
api.use("/paginas", rotasPaginas);
