# Roteiro do vídeo-pitch — ReUse! (4 minutos)

Objetivo da banca: passar por **todas as entregas das seis fases**, dizendo o que foi feito, por que
importa e **mostrando funcionando e integrado** na plataforma publicada.

## Antes de gravar (checklist)

- [ ] Abrir `https://<backend>.onrender.com/api/saude` e esperar o `{ "ok": true }` — o plano
      gratuito do Render hiberna e a primeira chamada demora ~30 s.
- [ ] Abrir o site publicado e fazer login com `equipe@reuse.app` / `reuse123`.
- [ ] Deixar **três abas** prontas: (1) site, (2) `/admin` já logado como `admin@reuse.app`,
      (3) `/api/pontos?material=ELETRONICO` para mostrar a API.
- [ ] Deixar **a conta de usuário sem descarte hoje**, para a missão do dia e o limite diário
      ficarem livres na demonstração.
- [ ] Permitir a localização no navegador (o “Perto de mim” e o Eco dependem dela).
- [ ] Gravar em 1080p, com o zoom do navegador em ~110% para o texto ficar legível.

---

## 0:00 – 0:25 · Abertura e problema (fase 01)

**Mostre:** a home publicada.

> “ReUse! é uma plataforma colaborativa de descarte consciente. O problema é simples: a maioria das
> pessoas quer reciclar, mas não sabe **onde** descartar nem **como** separar. Começamos na fase 01
> com wireframes e protótipos web e mobile — e a identidade visual que vocês veem aqui vem daí: a
> paleta é a das cores oficiais da coleta seletiva, então a cor já ensina.”

Role a home mostrando a trilha “Separe → Encontre o ponto → Registre e evolua” e os números da
comunidade.

## 0:25 – 0:55 · Mapa de pontos de coleta (fases 03 e 05)

**Mostre:** `/pontos`.

> “Esta é a área de descarte consciente. Filtro pelo material que tenho em mãos…”

- Clique no chip **Eletrônico** → a lista e o mapa filtram juntos.
- Clique em **Perto de mim** → ordena por distância e destaca o ponto mais próximo.
- Aponte os **anéis coloridos** dos pinos: mostram os materiais que cada ponto aceita.

> “Os filtros ficam na URL, então esse link pode ser compartilhado. E isso não é só tela: é a mesma
> API pública que o app mobile da fase 03 consome.”

Mude para a aba da API e mostre o JSON de `/api/pontos?material=ELETRONICO`.

## 0:55 – 1:35 · Gamificação funcionando (fase 02)

**Mostre:** abra um ponto, por exemplo o Ecoponto Vila Mariana.

> “Abrindo o ponto: materiais aceitos com dica de preparo, horário, rota no Google Maps e a atividade
> da comunidade. Agora o que a fase 02 trouxe — registro de descarte com gamificação.”

- Escolha o material, ajuste os volumes, clique em **Registrar descarte**.
- Deixe a **celebração** aparecer: EcoPontos, bônus de missão do dia, bônus de novo ponto, barra de
  nível e, se cair, a conquista desbloqueada.

> “Eletrônico vale mais ponto porque é o resíduo mais perigoso. A missão do dia muda a categoria em
> destaque todo dia, e existe limite de cinco registros diários para o ranking ficar justo.”

- Vá a **/perfil**: nível, volumes por material, trilha de níveis e conquistas.

## 1:35 – 2:05 · Comunidade, ranking e marketing (fase 04)

**Mostre:** `/ranking` e depois `/pontos/novo`.

> “O ranking é o mecanismo de engajamento do plano de marketing digital da fase 04: pódio, ranking do
> mês e a posição de cada pessoa. Ele soma descartes, pontos sugeridos e materiais cadastrados.”

- Em `/pontos/novo`, clique no mapa para marcar a posição e mostre o formulário.

> “Qualquer pessoa pode mapear um ponto que não está aqui: clica no mapa, marca o local e ganha
> EcoPontos. O ponto entra com o selo ‘Comunidade’ — e é aí que a área administrativa entra.”

## 2:05 – 2:50 · Assistente Eco (fase 06, ChatBot)

**Mostre:** `/assistente` ou o widget “Fale com o Eco”.

> “Na fase 06 construímos o Eco, o assistente da plataforma, com IBM watsonx Assistant. E ele não só
> responde: ele **executa tarefas**.”

- Digite (ou **fale pelo microfone**): *“onde descarto pilhas perto de mim?”* → cartões dos pontos
  mais próximos, com dica de preparo.
- Depois: *“registrei 2 sacolas de vidro no Ecoponto Vila Mariana”* → o Eco pede **confirmação** e
  registra, somando EcoPontos na hora (veja o cabeçalho atualizar).
- Depois: *“desfazer meu último descarte”* → ele desfaz e devolve os pontos.

> “Toda ação que grava dados pede confirmação e exige login. A skill está versionada em código: se as
> credenciais da IBM não estiverem configuradas, um motor local interpreta **a mesma skill**, então a
> plataforma nunca fica sem assistente — o selo no chat mostra qual motor está ativo.”

## 2:50 – 3:25 · Área administrativa (fase 06)

**Mostre:** a aba já logada em `/admin`.

> “Esta é a área administrativa da plataforma. O painel traz as métricas que a operação precisa:
> pessoas, pontos, descartes do dia e do mês, volumes destinados, EcoPontos distribuídos e a série
> dos últimos 14 dias.”

- Na seção **Aguardando verificação**, aprove o ponto que você acabou de sugerir.
- Volte ao mapa público e mostre o selo virando **“Verificado pela equipe”**.
- Passe rápido pelas abas **Catálogo**, **Descartes** (anular registro suspeito) e **Usuários**
  (promover a administrador).

> “É o ciclo completo e integrado: a comunidade sugere, a administração aprova, o mapa público muda.”

## 3:25 – 4:00 · Arquitetura do deploy e fechamento (fase 05)

**Mostre:** o índice da API no Render, lado a lado com o site na Vercel.

> “Para a entrega final, separamos o produto em dois deploys independentes: o **frontend** em Next.js
> na Vercel e o **backend** em Node.js com Express e Prisma no Render, com PostgreSQL gerenciado. O
> login devolve um JWT que o Next.js guarda em um cookie httpOnly — o token nunca fica exposto ao
> navegador. Cada tela carrega seus dados em uma única chamada, e as rotas REST continuam públicas
> para integrações.”

> “Em seis fases o ReUse! saiu do wireframe e virou uma plataforma no ar: mapa, catálogo
> colaborativo, gamificação, assistente com voz e área administrativa. Cada material tem um destino
> certo — e agora encontrar esse destino é fácil. Obrigado!”

---

## Dicas de execução

- **Fale sobre o que está na tela.** A banca avalia a integração: sempre amarre “isso aqui veio da
  fase X e conversa com a fase Y”.
- **Nada de tela de carregamento longa.** Deixe as páginas pré-abertas nas abas e troque entre elas.
- **Tenha um plano B para a voz.** Se o microfone falhar na gravação, digite a frase — o fluxo é o
  mesmo.
- **Corte o tempo morto.** 4 minutos é o teto; mire em 3:45 para não arriscar.
