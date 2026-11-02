# API do ReUse!

Backend em **Node.js + Express + Prisma + PostgreSQL**. Respostas sempre em JSON; erros no formato
`{ "erro": "mensagem pronta para a tela" }`.

**Base local:** `http://localhost:4000` · **Produção:** a URL do deploy no Render.

## Autenticação

O login devolve um **JWT**. Envie-o nas rotas privadas:

```
Authorization: Bearer <token>
```

A API é *stateless* — não existe rota de logout: o frontend apaga o cookie que guarda o token.

| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | `{ email, senha }` | `{ token, expiraEm, usuario }` |
| `POST` | `/api/auth/register` | `{ nome, email, senha }` | `{ token, expiraEm, usuario }` |
| `GET` | `/api/auth/me` | — | `{ usuario, resumo }` (resumo = EcoPontos e nível) |

## Índice e diagnóstico

| Método | Rota | O que devolve |
| --- | --- | --- |
| `GET` | `/` | Índice da API, com a lista de rotas |
| `GET` | `/api/saude` | `{ ok, banco }` — usado pelo health check do Render |
| `GET` | `/api/referencias` | Categorias com dicas e pesos, tipos de ponto e níveis |

## Pontos de coleta

| Método | Rota | Observações |
| --- | --- | --- |
| `GET` | `/api/pontos` | Filtros `material`, `tipo`, `lat`+`lng`. Com coordenadas, a lista volta ordenada por distância e cada ponto traz `distanciaKm` |
| `GET` | `/api/pontos/:id` | Detalhe + atividade recente da comunidade + volumes recebidos |
| `POST` | `/api/pontos` | **Login.** Sugestão colaborativa; entra com `verificado: false` |

```bash
curl "http://localhost:4000/api/pontos?material=ELETRONICO&lat=-23.56&lng=-46.65"
```

## Catálogo de materiais

| Método | Rota | Observações |
| --- | --- | --- |
| `GET` | `/api/items` | Filtros `categoria` e `q` (nome ou descrição) |
| `GET` | `/api/items/:id` | — |
| `POST` | `/api/items` | **Login.** `{ nomeItem, descricao, categoria, urlFoto? }` |
| `DELETE` | `/api/items/:id` | **Login.** Só o autor — ou um ADMIN |

## Favoritos

Todas exigem login. O corpo é `{ itemId }`.

| Método | Rota |
| --- | --- |
| `GET` | `/api/favoritos` |
| `POST` | `/api/favoritos` |
| `DELETE` | `/api/favoritos` |

## Gamificação

| Método | Rota | Observações |
| --- | --- | --- |
| `POST` | `/api/descartes` | **Login.** `{ pontoId, categoria, quantidade }`. Devolve EcoPontos, bônus, nível e conquistas novas. Recusas de regra de negócio voltam como **422** |
| `GET` | `/api/descartes/desfazivel` | **Login.** Último registro que ainda pode ser desfeito |
| `DELETE` | `/api/descartes/:id` | **Login.** Desfaz um registro recente (até 30 min) |
| `GET` | `/api/impacto` | **Login.** Estatísticas, nível, volumes por material e conquistas |
| `GET` | `/api/ranking` | `periodo=geral\|mes`, `limite` |
| `GET` | `/api/missao` | Missão do dia e, com login, se já foi cumprida |

## Assistente Eco

| Método | Rota | Observações |
| --- | --- | --- |
| `GET` | `/api/assistente` | `{ motor: "watson" \| "local" }` |
| `POST` | `/api/assistente` | `{ texto, contexto, localizacao?, paginaAtual? }` para conversar, ou `{ acao: { nome, params } }` para executar o botão de uma resposta. Devolve `{ blocos, contexto, efeitos, motor }` |

O `contexto` devolvido precisa voltar na requisição seguinte: é o estado do diálogo (slots em
preenchimento). Os `blocos` são a resposta já pronta para a interface (texto, opções, cartões,
botões, confirmação, progresso, celebração).

## Área administrativa

Exigem login **com papel `ADMIN`** (resposta `403` caso contrário).

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/api/admin/painel` | Métricas gerais, série dos últimos 14 dias, volumes por material, pontos pendentes, top pontos e últimos cadastros |
| `GET` | `/api/admin/pontos` | Filtros `q` e `status=todos\|pendentes\|verificados` |
| `PATCH` | `/api/admin/pontos/:id` | Aprovar (`{ verificado: true }`) ou editar os dados do ponto |
| `DELETE` | `/api/admin/pontos/:id` | Exclui o ponto e, em cascata, seus descartes |
| `GET` | `/api/admin/usuarios` | Contas com EcoPontos e contadores de atividade |
| `PATCH` | `/api/admin/usuarios/:id` | `{ papel: "ADMIN" \| "USUARIO" }` |
| `DELETE` | `/api/admin/usuarios/:id` | Exclui a conta (não é possível excluir a própria) |
| `GET` | `/api/admin/itens` | Catálogo com autor e número de favoritos |
| `DELETE` | `/api/admin/itens/:id` | Remove do catálogo |
| `GET` | `/api/admin/descartes` | Registros recentes, com `limite` e `categoria` |
| `DELETE` | `/api/admin/descartes/:id` | Anula um registro suspeito |

## Consultas agregadas (BFF do frontend)

Pensadas para cada tela do Next.js carregar tudo em uma chamada:

`/api/paginas/inicio` · `/api/paginas/pontos` · `/api/paginas/pontos/:id` ·
`/api/paginas/materiais` · `/api/paginas/materiais/:id` · `/api/paginas/perfil` (login) ·
`/api/paginas/favoritos` (login)

## CORS

Só as origens listadas em `ORIGENS_PERMITIDAS` (separadas por vírgula) podem chamar a API pelo
navegador. Requisições sem `Origin` — `curl`, app mobile, servidor para servidor — passam sempre.
