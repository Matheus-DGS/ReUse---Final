// /api/favoritos — lista, adiciona e remove materiais favoritos do usuário autenticado.

import { Router } from "express";
import { rota } from "@/lib/http";
import { exigirLogin, usuarioDe } from "@/middleware/auth";
import { desfavoritar, favoritar, listarFavoritos } from "@/services/favoritos";

export const rotasFavoritos = Router();

rotasFavoritos.use(exigirLogin);

rotasFavoritos.get(
  "/",
  rota(async (req, res) => {
    res.json({ favoritos: await listarFavoritos(usuarioDe(req).id) });
  })
);

rotasFavoritos.post(
  "/",
  rota(async (req, res) => {
    const favorito = await favoritar(usuarioDe(req).id, String(req.body?.itemId ?? ""));
    res.status(201).json({ favorito });
  })
);

rotasFavoritos.delete(
  "/",
  rota(async (req, res) => {
    await desfavoritar(usuarioDe(req).id, String(req.body?.itemId ?? ""));
    res.json({ ok: true });
  })
);
