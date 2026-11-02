// /api/paginas/* — endpoints agregados que alimentam cada tela do frontend (BFF).

import { Router } from "express";
import { rota } from "@/lib/http";
import { exigirLogin, usuarioDe } from "@/middleware/auth";
import {
  paginaFavoritos,
  paginaInicio,
  paginaMaterial,
  paginaMateriais,
  paginaPerfil,
  paginaPonto,
  paginaPontos,
} from "@/services/paginas";

export const rotasPaginas = Router();

rotasPaginas.get(
  "/inicio",
  rota(async (req, res) => {
    res.json(await paginaInicio(req.usuario?.id ?? null));
  })
);

rotasPaginas.get(
  "/pontos",
  rota(async (req, res) => {
    res.json(await paginaPontos(req.usuario?.id ?? null));
  })
);

rotasPaginas.get(
  "/pontos/:id",
  rota(async (req, res) => {
    res.json(await paginaPonto(req.params.id, req.usuario?.id ?? null));
  })
);

rotasPaginas.get(
  "/materiais",
  rota(async (req, res) => {
    res.json(
      await paginaMateriais({
        categoria: req.query.categoria as string | undefined,
        q: req.query.q as string | undefined,
      })
    );
  })
);

rotasPaginas.get(
  "/materiais/:id",
  rota(async (req, res) => {
    res.json(await paginaMaterial(req.params.id, req.usuario?.id ?? null));
  })
);

rotasPaginas.get(
  "/perfil",
  exigirLogin,
  rota(async (req, res) => {
    res.json(await paginaPerfil(usuarioDe(req).id));
  })
);

rotasPaginas.get(
  "/favoritos",
  exigirLogin,
  rota(async (req, res) => {
    res.json(await paginaFavoritos(usuarioDe(req).id));
  })
);
