# ReUse! — Entrega final (conteúdo do PDF)

**Aluno:** Matheus Dias Gomes Silva — RM563021 — 2TWDOA
**Projeto:** ReUse! — plataforma digital colaborativa de descarte consciente e reuso

> Preencha os três links abaixo depois de publicar e gravar. Este arquivo é o rascunho do PDF
> entregue (os critérios são 30% deploy e 70% vídeo-pitch).

---

## 1. Deploy

| Item | Link |
| --- | --- |
| **Frontend** (Next.js · Vercel) | `https://________.vercel.app` |
| **Backend** (Node.js + Express · Render) | `https://________.onrender.com` |
| Índice da API (documentação rápida) | `https://________.onrender.com/` |
| Health check da API | `https://________.onrender.com/api/saude` |
| Exemplo da API pública | `https://________.onrender.com/api/pontos?material=ELETRONICO` |

**Stack publicada**

- **Frontend:** Next.js 16 (App Router) + TypeScript, Server Components, Server Actions,
  Route Handlers, Leaflet + OpenStreetMap, CSS Modules.
- **Backend:** Node.js + Express + Prisma ORM + PostgreSQL, autenticação JWT, CORS restrito.
- **Banco:** PostgreSQL gerenciado (Render Postgres), migrations e seed aplicados no build.

**Contas de demonstração** (senha `reuse123`)

| Conta | Perfil | Para quê |
| --- | --- | --- |
| `equipe@reuse.app` | Usuário | Navegação, descartes, favoritos, perfil e ranking |
| `admin@reuse.app` | Administrador | Área administrativa (`/admin`) |

> O plano gratuito do Render hiberna o serviço após ~15 min sem acesso. Abra `/api/saude` para
> acordar a API antes de avaliar ou gravar.

---

## 2. Vídeo-pitch

| Item | Link |
| --- | --- |
| **Vídeo-pitch** (até 4 minutos) | `https://________` |

Roteiro usado na gravação: [`ROTEIRO-VIDEO-PITCH.md`](ROTEIRO-VIDEO-PITCH.md).

---

## 3. Repositório

| Item | Link |
| --- | --- |
| Código-fonte (frontend + backend) | `https://github.com/________` |

---

## 4. As seis fases dentro do produto final

| Fase | Entrega da fase | Onde aparece na plataforma publicada |
| --- | --- | --- |
| **01** | Wireframes e protótipos web e mobile | Identidade visual e arquitetura de telas de todo o site: paleta das cores da coleta seletiva (CONAMA 275/2001), tipografia e layout responsivo |
| **02** | Mobile em React Native, animações e plano de gamificação | EcoPontos com peso por material, 5 níveis, 9 conquistas, missão do dia, bônus de exploração e as animações do plano (entrada, cards em sequência, celebração de conquista, transição de tela) |
| **03** | Evolução do desenvolvimento mobile | API pública `GET /api/pontos` com filtros por material e tipo e ordenação por distância — o mesmo contrato que o app mobile consome |
| **04** | Plano de marketing digital | Home com proposta de valor e prova social (números da comunidade), ranking público como mecanismo de engajamento, SEO por página e links compartilháveis (filtros do mapa na URL) |
| **05** | Full stack Next.js + Node + Prisma | Modelo de dados em Prisma (6 entidades) e, nesta entrega, o backend extraído para um **serviço Express próprio**, consumido por HTTP com JWT |
| **06** | ChatBot e área administrativa | Assistente **Eco** (IBM watsonx Assistant, com motor local de fallback lendo a mesma skill) e **área administrativa** em `/admin`: métricas, aprovação de pontos da comunidade, curadoria do catálogo, moderação de descartes e gestão de contas |

---

## 5. Como a integração acontece

1. A pessoa pergunta ao **Eco** onde descartar pilhas → o assistente consulta os **pontos de coleta**
   (fase 03/05) e usa a localização do navegador para ordenar por distância.
2. Ela vai ao ponto, abre a página dele e **registra o descarte** → a **gamificação** (fase 02)
   calcula EcoPontos, bônus de missão, nível e conquistas, e o **ranking** (fase 04) se atualiza.
3. Encontrou um ponto que não estava no mapa? **Sugere** o local clicando no mapa → ele nasce com o
   selo “Comunidade” e vai para a fila de aprovação da **área administrativa** (fase 06).
4. O administrador **aprova** o ponto → o selo vira “Verificado pela equipe” no mapa público.
5. Tudo isso roda sobre **um único banco PostgreSQL**, acessado apenas pelo **backend** (fase 05),
   que o frontend consome por HTTP — os dois publicados separadamente.
