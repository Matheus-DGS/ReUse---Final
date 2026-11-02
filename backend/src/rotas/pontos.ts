// /api/pontos — API pública de pontos de coleta (consumida pelo site e pelo app mobile).

import { Router } from "express";
import { rota } from "@/lib/http";
import { exigirLogin, usuarioDe } from "@/middleware/auth";
import { criarPonto, listarPontos, pontoPorId } from "@/services/pontos";
import { PONTOS_SUGESTAO_PONTO } from "@/dominio/gamificacao";

export const rotasPontos = Router();

// GET /api/pontos?material=VIDRO&tipo=ECOPONTO&lat=-23.56&lng=-46.65
// Com lat/lng, a lista volta ordenada pela distância (em km) até a pessoa.
rotasPontos.get(
  "/",
  rota(async (req, res) => {
    const pontos = await listarPontos({
      material: req.query.material as string | undefined,
      tipo: req.query.tipo as string | undefined,
      lat: Number(req.query.lat),
      lng: Number(req.query.lng),
    });
    res.json({ total: pontos.length, pontos });
  })
);

rotasPontos.get(
  "/:id",
  rota(async (req, res) => {
    res.json({ ponto: await pontoPorId(req.params.id) });
  })
);

// POST /api/pontos — sugestão colaborativa de ponto (requer login)
rotasPontos.post(
  "/",
  exigirLogin,
  rota(async (req, res) => {
    const ponto = await criarPonto(usuarioDe(req).id, req.body ?? {});
    res.status(201).json({ ponto, pontosGanhos: PONTOS_SUGESTAO_PONTO });
  })
);
