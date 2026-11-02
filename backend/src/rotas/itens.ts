// /api/items — catálogo colaborativo de materiais recicláveis.

import { Router } from "express";
import { rota } from "@/lib/http";
import { exigirLogin, usuarioDe } from "@/middleware/auth";
import { criarItem, itemPorId, listarItens, removerItem } from "@/services/materiais";
import { PONTOS_MATERIAL_CATALOGO } from "@/dominio/gamificacao";

export const rotasItens = Router();

// GET /api/items?categoria=PLASTICO&q=garrafa
rotasItens.get(
  "/",
  rota(async (req, res) => {
    const itens = await listarItens({
      categoria: req.query.categoria as string | undefined,
      q: req.query.q as string | undefined,
    });
    res.json({ total: itens.length, itens });
  })
);

rotasItens.get(
  "/:id",
  rota(async (req, res) => {
    res.json({ item: await itemPorId(req.params.id) });
  })
);

rotasItens.post(
  "/",
  exigirLogin,
  rota(async (req, res) => {
    const item = await criarItem(usuarioDe(req).id, req.body ?? {});
    res.status(201).json({ item, pontosGanhos: PONTOS_MATERIAL_CATALOGO });
  })
);

rotasItens.delete(
  "/:id",
  exigirLogin,
  rota(async (req, res) => {
    await removerItem(req.params.id, usuarioDe(req));
    res.json({ ok: true });
  })
);
