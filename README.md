# ReUse! — entrega final

Plataforma digital colaborativa que promove o descarte consciente e a troca de materiais entre
pessoas. Esta pasta reúne **todas as áreas construídas ao longo das seis fases do projeto** em um
único produto, agora dividido em **dois deploys independentes**:

| Camada | Tecnologia | Pasta | Deploy |
| --- | --- | --- | --- |
| **Frontend** | Next.js 16 (App Router) + TypeScript | [`frontend/`](frontend) | Vercel |
| **Backend** | Node.js + Express + Prisma + PostgreSQL | [`backend/`](backend) | Render |

> **Links da entrega:** preencha em [`docs/ENTREGA.md`](docs/ENTREGA.md) — é o conteúdo do PDF.
>
> **Contas de demonstração** (criadas pelo seed): `equipe@reuse.app` / `reuse123` (usuário) e
> `admin@reuse.app` / `reuse123` (área administrativa).

---

## O que cada fase entregou e onde ela vive hoje

| Fase | Entrega | Onde está nesta versão |
| --- | --- | --- |
| **01** | Wireframes e protótipos web e mobile | Identidade visual, paleta da coleta seletiva (CONAMA 275/2001) e arquitetura de telas de todo o frontend |
| **02** | Mobile em React Native, animações e plano de gamificação | EcoPontos, 5 níveis, 9 conquistas, missão do dia e os keyframes do plano (`frontend/src/app/globals.css`, `components/gamificacao/`) |
| **03** | Evolução do mobile | API pública `GET /api/pontos` com filtros e ordenação por distância, pensada para o app consumir |
| **04** | Plano de marketing digital | Home com proposta de valor, provas sociais (números da comunidade), ranking público e SEO por página (`generateMetadata`) |
| **05** | Full stack Next.js + Node + Prisma | Modelo de dados completo no Prisma e, nesta entrega, o **backend separado em um serviço próprio** consumido por HTTP |
| **06** | ChatBot e área administrativa | Assistente **Eco** (IBM watsonx Assistant + motor local) em `backend/src/assistente` e **área administrativa** em `/admin` |

---

## Arquitetura

```
┌────────────────────────────┐        HTTPS + JWT (Bearer)      ┌──────────────────────────────┐
│  frontend/  (Vercel)       │ ───────────────────────────────► │  backend/  (Render)          │
│  Next.js 16 · App Router   │                                  │  Node.js + Express           │
│                            │ ◄─────────────────────────────── │  Prisma ORM                  │
│  Server Components         │            JSON                  │                              │
│  Server Actions            │                                  └──────────────┬───────────────┘
│  /api/* → proxy da sessão  │                                                 │
└────────────────────────────┘                                                 ▼
                                                                  ┌──────────────────────────┐
                                                                  │  PostgreSQL (Render/Neon)│
                                                                  └──────────────────────────┘
```

**Como a sessão funciona.** O login vai para o backend, que devolve um **JWT**. O Next.js guarda
esse token em um **cookie httpOnly** (`reuse_session`) — ele nunca chega ao JavaScript do navegador.
Em toda renderização no servidor, o token sai do cookie e vira o header `Authorization: Bearer`.
Chamadas feitas pelo navegador (chat do Eco, favoritos, ações do painel) passam pelo proxy
`frontend/src/app/api/[...caminho]/route.ts`, que anexa o token no servidor e repassa à API.

**Por que um BFF.** Cada tela carrega os dados em **uma** chamada (`/api/paginas/*`) em vez de cinco
ou seis. As rotas REST (`/api/pontos`, `/api/items`, `/api/ranking`, `/api/missao`) continuam
públicas e versáteis para integrações — é o mesmo contrato que o app mobile da fase 03 consome.

---

## Áreas da plataforma

| Rota | O que faz |
| --- | --- |
| `/` | Home: proposta de valor, números da comunidade, minimapa, missão do dia e destaques do mês |
| `/pontos` | Mapa interativo (Leaflet + OpenStreetMap) com lista sincronizada, filtros por material e tipo, **“Perto de mim”** com ordenação por distância. Os filtros ficam na URL |
| `/pontos/[id]` | Detalhe do ponto: materiais aceitos com dicas de preparo, horário, rota no Google Maps, atividade da comunidade e **registro de descarte** com celebração animada |
| `/pontos/novo` | Sugestão colaborativa: a pessoa marca a posição clicando no mapa (ou usa o GPS). O ponto entra com o selo “Comunidade” |
| `/materiais`, `/materiais/[id]`, `/materiais/novo` | Catálogo colaborativo com busca, filtro por categoria, “Onde descartar” e cadastro |
| `/favoritos` | Materiais salvos pela pessoa |
| `/perfil` | **Meu impacto**: nível com barra de progresso, EcoPontos, volumes por material, trilha de níveis, conquistas e histórico |
| `/ranking` | Ranking geral e do mês, com pódio |
| `/assistente` | **Assistente Eco**: conversa por texto ou voz, executa tarefas e ensina a usar a plataforma |
| `/admin` | **Área administrativa**: métricas, aprovação de pontos, curadoria do catálogo, moderação de descartes e gestão de contas |

O assistente também está em um widget flutuante (“Fale com o Eco”) em todas as páginas.

---

## Rodando localmente

Pré-requisitos: **Node.js 20+** e um **PostgreSQL** (local, [Neon](https://neon.tech) ou
[Supabase](https://supabase.com) — os dois têm plano gratuito).

### 1. Backend (porta 4000)

```bash
cd backend
npm install
cp .env.example .env      # preencha DATABASE_URL, DATABASE_URL_UNPOOLED e JWT_SECRET
npx prisma migrate deploy # cria as tabelas
npx prisma db seed        # dados de demonstração (idempotente)
npm run dev
```

Confira em <http://localhost:4000> (índice da API) e <http://localhost:4000/api/saude>.

### 2. Frontend (porta 3000)

```bash
cd frontend
npm install
cp .env.example .env.local   # API_URL="http://localhost:4000"
npm run dev
```

Abra <http://localhost:3000>.

### Scripts úteis

| Comando | Onde | O que faz |
| --- | --- | --- |
| `npm run typecheck` | ambos | Verificação de tipos |
| `npm run assistente:testar` | backend | 50+ testes do fluxo conversacional do Eco |
| `npm run assistente:gerar` | backend | Regera `watson/reuse-assistente-dialog.json` a partir de `watson/fonte/` |
| `npm run db:studio` | backend | Prisma Studio |
| `npm run build` | frontend | Build de produção do Next.js |

---

## Deploy

### Backend no Render (+ PostgreSQL gratuito)

Com o **blueprint** ([`render.yaml`](render.yaml)), o Render cria o banco e o serviço de uma vez:

1. Publique esta pasta em um repositório no GitHub.
2. No Render: **New + → Blueprint** e aponte para o repositório.
3. O blueprint provisiona o banco `reuse-postgres` e o web service `reuse-api` (`rootDir: backend`).
   O build roda `prisma generate`, `prisma migrate deploy` e o seed; `JWT_SECRET` é gerado sozinho.
4. Depois do deploy do frontend, preencha `ORIGENS_PERMITIDAS` com a URL da Vercel e redeploy.

Manualmente, sem blueprint: **New + → Web Service**, root directory `backend`,
build `npm install && npm run build`, start `npm start`, health check `/api/saude`, e as variáveis
do [`backend/.env.example`](backend/.env.example).

### Frontend na Vercel

1. **Add New → Project**, importe o mesmo repositório.
2. Em **Root Directory**, selecione `frontend`. O preset Next.js já configura build e output.
3. Em **Environment Variables**, adicione `API_URL` com a URL do backend no Render
   (ex.: `https://reuse-api.onrender.com`, **sem** barra no final).
4. Deploy. Em seguida, volte ao Render e coloque a URL da Vercel em `ORIGENS_PERMITIDAS`.

> O plano gratuito do Render **hiberna** o serviço após ~15 min sem acesso: a primeira requisição
> depois disso leva ~30 s. Antes de gravar o vídeo-pitch, abra `/api/saude` para “acordar” a API.

---

## Modelo de dados

Evolução do PBL de Modelagem de Dados, com o campo `papel` acrescentado nesta entrega:

- **Usuario** — nome, e-mail, senha (hash bcrypt), **papel** (`USUARIO` | `ADMIN`), data de cadastro
- **Item** — material do catálogo, com categoria e autor · **FotoItem** — fotos do material
- **Favorito** — vínculo pessoa ↔ material (par único)
- **PontoColeta** — nome, tipo (Ecoponto, PEV, Cooperativa, Parceiro), endereço, coordenadas,
  horário, materiais aceitos (`Categoria[]`), selo de verificado e quem sugeriu
- **Descarte** — pessoa, ponto, categoria, volumes e EcoPontos ganhos. É a base da gamificação

Schema em [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

---

## Gamificação (do “Plano de Animações e Gamificação”)

- **EcoPontos** por volume, com peso por material — eletrônicos valem mais por serem os resíduos
  mais perigosos
- **Missão do dia**: a cada dia uma categoria diferente vale +20 de bônus
- **Bônus de exploração** (+10) no primeiro descarte em cada ponto
- **5 níveis**: Semente → Broto → Muda → Árvore → Floresta
- **9 conquistas** calculadas a partir do comportamento da pessoa
- **Anti-abuso**: no máximo 5 registros por dia, e o ponto precisa aceitar o material informado
- Sugerir ponto (+30) e cadastrar material (+10) também pontuam

---

## Assistente Eco (ChatBot)

- Skill do IBM watsonx Assistant versionada em código: as fontes legíveis ficam em
  `backend/watson/fonte/` e `npm run assistente:gerar` monta o JSON de importação.
- **Sem credenciais da IBM**, o **motor local** (`backend/src/assistente/motor-local.ts`) interpreta
  a *mesma* skill — classificador TF-IDF + cosseno, reconhecimento de entidades por sinônimos e
  execução de diálogo com slots. O comportamento é o mesmo com ou sem a IBM configurada, e o selo no
  chat mostra qual motor está ativo.
- Ele **executa tarefas** de verdade (registrar e desfazer descartes, buscar pontos, favoritos,
  cadastro de materiais, consultas de EcoPontos, missão e ranking) e **orienta** com passo a passo.
  Tudo que grava dados pede confirmação e exige login.
- Aceita **voz**: ditado pelo microfone e leitura das respostas (Web Speech API).

Detalhes em [`backend/watson/README.md`](backend/watson/README.md).

---

## Documentação complementar

- [`docs/ENTREGA.md`](docs/ENTREGA.md) — conteúdo do PDF da entrega (links de deploy e do vídeo)
- [`docs/ROTEIRO-VIDEO-PITCH.md`](docs/ROTEIRO-VIDEO-PITCH.md) — roteiro do vídeo de 4 minutos
- [`docs/API.md`](docs/API.md) — referência dos endpoints da API

---

Projeto acadêmico · FIAP · Matheus Dias Gomes Silva (RM563021) · 2TWDOA
