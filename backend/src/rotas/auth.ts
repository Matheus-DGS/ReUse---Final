// POST /api/auth/login · POST /api/auth/register · GET /api/auth/me
//
// O login devolve um token JWT. Como a API é stateless, não existe logout no servidor:
// o frontend apaga o cookie que guarda o token.

import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { erro, rota } from "@/lib/http";
import { conferirSenha, gerarHash } from "@/lib/senha";
import { DURACAO_SESSAO, assinarSessao } from "@/lib/sessao";
import { exigirLogin, usuarioDe } from "@/middleware/auth";
import { estatisticasDoUsuario } from "@/services/impacto";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const rotasAuth = Router();

rotasAuth.post(
  "/login",
  rota(async (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const senha = String(req.body?.senha ?? "");

    if (!email || !senha) throw erro(400, "Informe e-mail e senha.");

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    const senhaValida = usuario ? await conferirSenha(senha, usuario.senha) : false;
    // Mesma mensagem para e-mail inexistente e senha errada: não revela quem tem conta
    if (!usuario || !senhaValida) throw erro(401, "E-mail ou senha inválidos.");

    res.json({
      token: await assinarSessao({ userId: usuario.id }),
      expiraEm: DURACAO_SESSAO,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
    });
  })
);

rotasAuth.post(
  "/register",
  rota(async (req, res) => {
    const nome = String(req.body?.nome ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const senha = String(req.body?.senha ?? "");

    if (!nome || !email || !senha) throw erro(400, "Preencha nome, e-mail e senha.");
    if (!EMAIL_VALIDO.test(email)) throw erro(400, "Informe um e-mail válido.");
    if (senha.length < 6) throw erro(400, "A senha deve ter pelo menos 6 caracteres.");

    const existente = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
    if (existente) throw erro(409, "Já existe uma conta com este e-mail.");

    const usuario = await prisma.usuario.create({
      data: { nome: nome.slice(0, 80), email, senha: await gerarHash(senha) },
    });

    res.status(201).json({
      token: await assinarSessao({ userId: usuario.id }),
      expiraEm: DURACAO_SESSAO,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
    });
  })
);

// Usado pelo frontend em toda renderização: identifica a sessão e já devolve o resumo
// de gamificação que aparece no cabeçalho (EcoPontos e nível).
rotasAuth.get(
  "/me",
  rota(async (req, res) => {
    if (!req.usuario) {
      res.json({ usuario: null, resumo: null });
      return;
    }

    const { estatisticas, nivel } = await estatisticasDoUsuario(req.usuario.id);
    res.json({
      usuario: req.usuario,
      resumo: { totalPontos: estatisticas.totalPontos, nivel: nivel.nome, numeroNivel: nivel.numero },
    });
  })
);

rotasAuth.get(
  "/sessao",
  exigirLogin,
  rota(async (req, res) => {
    res.json({ usuario: usuarioDe(req) });
  })
);
