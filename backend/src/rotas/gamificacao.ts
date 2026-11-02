// /api/descartes · /api/impacto · /api/ranking · /api/missao
// Rotas da gamificação: registro de descarte, extrato de impacto, ranking e missão do dia.

import { Router } from "express";
import { ErroHttp, erro, rota } from "@/lib/http";
import { exigirLogin, usuarioDe } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";
import {
  MINUTOS_PARA_DESFAZER,
  registrarDescarteDoUsuario,
  ultimoDescarteDesfazivel,
} from "@/services/descartes";
import { estatisticasDoUsuario, rankingDeUsuarios } from "@/services/impacto";
import { CONQUISTAS, inicioDoDiaSP, missaoDoDia } from "@/dominio/gamificacao";

export const rotasDescartes = Router();

// POST /api/descartes { pontoId, categoria, quantidade }
rotasDescartes.post(
  "/",
  exigirLogin,
  rota(async (req, res) => {
    const resultado = await registrarDescarteDoUsuario(usuarioDe(req).id, {
      pontoId: String(req.body?.pontoId ?? ""),
      categoria: req.body?.categoria,
      quantidade: Number(req.body?.quantidade ?? 1),
    });

    // As recusas são regra de negócio (ponto não aceita o material, limite diário...),
    // por isso voltam como 422 com a mensagem pronta para a tela.
    if (resultado.status === "erro") throw new ErroHttp(422, resultado.mensagem);

    res.status(201).json(resultado);
  })
);

// GET /api/descartes/desfazivel — último registro que ainda pode ser desfeito
rotasDescartes.get(
  "/desfazivel",
  exigirLogin,
  rota(async (req, res) => {
    const ultimo = await ultimoDescarteDesfazivel(usuarioDe(req).id);
    res.json({ descarte: ultimo, minutos: MINUTOS_PARA_DESFAZER });
  })
);

// DELETE /api/descartes/:id — desfaz um registro recente feito por engano
rotasDescartes.delete(
  "/:id",
  exigirLogin,
  rota(async (req, res) => {
    const ultimo = await ultimoDescarteDesfazivel(usuarioDe(req).id);
    if (!ultimo || ultimo.id !== req.params.id) {
      throw erro(
        422,
        `Esse registro não pode mais ser desfeito. Só é possível desfazer o descarte mais recente, em até ${MINUTOS_PARA_DESFAZER} minutos.`
      );
    }

    await prisma.descarte.delete({ where: { id: ultimo.id } });
    res.json({ ok: true, pontosRemovidos: ultimo.pontos, ponto: ultimo.ponto });
  })
);

// ------------------------------------------------------------------ consultas

export const rotasImpacto = Router();

rotasImpacto.get(
  "/",
  exigirLogin,
  rota(async (req, res) => {
    const impacto = await estatisticasDoUsuario(usuarioDe(req).id);
    res.json({
      ...impacto,
      conquistas: CONQUISTAS.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        descricao: c.descricao,
        simbolo: c.simbolo,
        desbloqueada: c.atingiu(impacto.estatisticas),
      })),
    });
  })
);

export const rotasRanking = Router();

// GET /api/ranking?periodo=mes&limite=50
rotasRanking.get(
  "/",
  rota(async (req, res) => {
    const periodo = req.query.periodo === "mes" ? "mes" : "geral";
    const limite = Math.min(Math.max(Number(req.query.limite) || 50, 1), 1000);
    const ranking = await rankingDeUsuarios(periodo, limite);
    res.json({ periodo, total: ranking.length, ranking });
  })
);

export const rotasMissao = Router();

rotasMissao.get(
  "/",
  rota(async (req, res) => {
    const missao = missaoDoDia();
    const cumprida = req.usuario
      ? (await prisma.descarte.count({
          where: { usuarioId: req.usuario.id, categoria: missao.categoria, data: { gte: inicioDoDiaSP() } },
        })) > 0
      : false;
    res.json({ missao, cumprida });
  })
);
