// /api/admin/* — área administrativa. Todas as rotas exigem um usuário com papel ADMIN.

import { Router } from "express";
import { rota } from "@/lib/http";
import { exigirAdmin, usuarioDe } from "@/middleware/auth";
import {
  alterarPapel,
  atualizarPonto,
  listarDescartesAdmin,
  listarItensAdmin,
  listarPontosAdmin,
  listarUsuarios,
  painel,
  removerDescarte,
  removerPonto,
  removerUsuario,
  type FiltroStatus,
} from "@/services/admin";
import { removerItem } from "@/services/materiais";

export const rotasAdmin = Router();

rotasAdmin.use(exigirAdmin);

// ------------------------------------------------------------------ painel

rotasAdmin.get(
  "/painel",
  rota(async (_req, res) => {
    res.json(await painel());
  })
);

// ------------------------------------------------------------------ pontos de coleta

rotasAdmin.get(
  "/pontos",
  rota(async (req, res) => {
    const status = ["verificados", "pendentes"].includes(String(req.query.status))
      ? (req.query.status as FiltroStatus)
      : "todos";
    const pontos = await listarPontosAdmin({ q: req.query.q as string | undefined, status });
    res.json({ total: pontos.length, pontos });
  })
);

rotasAdmin.patch(
  "/pontos/:id",
  rota(async (req, res) => {
    res.json({ ponto: await atualizarPonto(req.params.id, req.body ?? {}) });
  })
);

rotasAdmin.delete(
  "/pontos/:id",
  rota(async (req, res) => {
    res.json({ ok: true, ...(await removerPonto(req.params.id)) });
  })
);

// ------------------------------------------------------------------ usuários

rotasAdmin.get(
  "/usuarios",
  rota(async (req, res) => {
    const usuarios = await listarUsuarios({ q: req.query.q as string | undefined });
    res.json({ total: usuarios.length, usuarios });
  })
);

rotasAdmin.patch(
  "/usuarios/:id",
  rota(async (req, res) => {
    const usuario = await alterarPapel(req.params.id, req.body?.papel, usuarioDe(req).id);
    res.json({ usuario });
  })
);

rotasAdmin.delete(
  "/usuarios/:id",
  rota(async (req, res) => {
    res.json({ ok: true, ...(await removerUsuario(req.params.id, usuarioDe(req).id)) });
  })
);

// ------------------------------------------------------------------ catálogo

rotasAdmin.get(
  "/itens",
  rota(async (req, res) => {
    const itens = await listarItensAdmin({
      q: req.query.q as string | undefined,
      categoria: req.query.categoria as string | undefined,
    });
    res.json({ total: itens.length, itens });
  })
);

rotasAdmin.delete(
  "/itens/:id",
  rota(async (req, res) => {
    await removerItem(req.params.id, usuarioDe(req));
    res.json({ ok: true });
  })
);

// ------------------------------------------------------------------ descartes (moderação)

rotasAdmin.get(
  "/descartes",
  rota(async (req, res) => {
    const descartes = await listarDescartesAdmin({
      limite: Number(req.query.limite) || 40,
      categoria: req.query.categoria as string | undefined,
    });
    res.json({ total: descartes.length, descartes });
  })
);

rotasAdmin.delete(
  "/descartes/:id",
  rota(async (req, res) => {
    res.json({ ok: true, ...(await removerDescarte(req.params.id)) });
  })
);
