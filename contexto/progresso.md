# Progresso do Projeto

## 🚀 Versão Atual: v0.3.0 (Reset Diário de Missões)

## ✅ Tarefas Concluídas

* Definição do escopo do projeto (SaaS Solo Leveling: gamificação de produtividade/fitness/desenvolvimento pessoal).
* Criação da estrutura de contexto atômico (`regras.md`, `contexto/`).
* **Navegação por abas + Quest Log:**
  * Instalada dependência `@react-navigation/bottom-tabs`
  * Migrado `App.tsx` de Stack.Navigator para Tab.Navigator com abas inferiores (Home, Status, Quests)
  * Melhorado `HomeScreen.tsx` com boas-vindas e botões de atalho para Status e Missões
  * Criado `mobile/src/screens/QuestsScreen.tsx` como placeholder do Quest Log
* Mapeamento completo de funcionalidades, telas, menus e modelo de negócio.
* **Inicialização dos projetos:**
  * Backend Fastify + TypeScript + Dockerfile criado em `backend/`
  * Mobile React Native (Expo) criado em `mobile/`
  * `docker-compose.yml` configurado com backend + PostgreSQL
* **Schema do banco de dados:**
  * Script SQL com tabelas `Users`, `User_Attributes` e `Quests` criado em `backend/src/db/schema.sql`
  * Conexão com PostgreSQL via Knex configurada em `backend/src/db/connection.ts`
  * Rota `GET /health` atualizada com verificação de conexão ao banco

## ✅ Tarefas Concluídas (continuação)

* **API de Missões + Listagem no Quest Log:**
  * Criado `backend/src/routes/quests.ts` com rotas `GET /quests` e `POST /quests` (protegidas por JWT)
  * Registrado roteador de quests em `backend/src/index.ts`
  * Atualizado `mobile/src/screens/QuestsScreen.tsx` com FlatList para exibir missões da API e formulário para criar novas missões (tipo, descrição, XP)

## ✅ Tarefas Concluídas (continuação)

* **Tela de Status do Hunter:**
  * Expandido `GET /auth/me` no backend com LEFT JOIN em `User_Attributes` para retornar level, xp_total, str, agi, int, vit
  * Criado `mobile/src/screens/StatusScreen.tsx` com card de rank/nome/level, barra de XP e atributos com barras coloridas
  * Adicionada `StatusScreen` na navegação do `App.tsx` (rota "Status" no Stack.Navigator)

* **CRUD completo de Missões (PATCH + DELETE):**
  * Criada rota `PATCH /quests/:id` (protegida) que alterna o status `concluida` com `NOT concluida`
  * Criada rota `DELETE /quests/:id` (protegida) que remove a missão com verificação de propriedade
  * Adicionados botões de concluir (✓/↩) e excluir (✕) em cada card no `QuestsScreen.tsx`
  * Confirmação de exclusão via `Alert.alert` no mobile

* **Rota GET /auth/me + Tela de Login Mobile:**
  * Adicionada rota `GET /auth/me` protegida por JWT em `backend/src/routes/auth.ts`
  * Criado `mobile/src/services/api.ts` com axios + interceptador para token JWT
  * Criado `mobile/src/screens/LoginScreen.tsx` com formulário de login e armazenamento do token no AsyncStorage
  * Criado `mobile/src/screens/HomeScreen.tsx` como placeholder pós-login
  * Atualizado `mobile/App.tsx` com navegação condicional (LoginScreen ou HomeScreen)
  * Adicionadas dependências: axios, @react-native-async-storage/async-storage

* **Migration automática + POST /users:**
  * `connection.ts` modificada para executar `schema.sql` via `runMigrations()` na inicialização
  * Criado `routes/users.ts` com rota `POST /users`, validando nome/email obrigatórios, verificando duplicidade (409) e inserindo usuário + atributos em uma transação
  * `index.ts` modificado para rodar `runMigrations()` antes do `listen()` e registrar o roteador de usuários
* **Autenticação JWT:**
  * Adicionada coluna `senha_hash` na tabela `Users` no schema.sql
  * `POST /users` modificado para aceitar e hashear senha com bcryptjs
  * Criada rota `POST /auth/login` que valida credenciais e retorna token JWT
  * Registrado `@fastify/jwt` no servidor com `authenticate` decorator para proteger rotas
  * Dependências adicionadas: `@fastify/jwt`, `bcryptjs`, `@types/bcryptjs`

* **Cálculo de XP Dinâmico ao Completar Missão:**
  * Modificado `PATCH /quests/:id` no backend para somar `xp_recompensa` ao `User_Attributes.xp_total` ao marcar como concluída, e subtrair ao desmarcar
  * Implementada verificação de level up com fórmula `level * 1000`, suportando múltiplos níveis de uma vez com while loop
  * Atualizada `StatusScreen` para recarregar dados via `useFocusEffect` ao focar a aba
  * Corrigida fórmula de XP na barra de progresso de `level * 100` para `level * 1000`

* **Sistema de Penalidade — Modo Vermelho e Missão de Punição:**
  * Adicionada coluna `modo_vermelho BOOLEAN DEFAULT FALSE` na tabela `Users` (schema.sql)
  * Incluído campo `modo_vermelho` na resposta de `GET /auth/me` (auth.ts)
  * Criado `backend/src/cron/verificar_punicoes.ts` com cron job via `setInterval` que verifica missões pendentes do dia anterior e gera missão de punição com XP negativo (-500) + ativa modo vermelho
  * Registrado cron job no `index.ts`
  * `POST /quests` modificado para bloquear criação de missões quando `modo_vermelho = true` (exceto se tipo = "punição")
  * `PATCH /quests/:id` modificado para remover `modo_vermelho` ao concluir uma missão de punição
  * Adicionado banner vermelho na `StatusScreen` e `QuestsScreen` quando modo vermelho está ativo
  * Ocultado botão "+ Nova Missão" na `QuestsScreen` durante modo vermelho
  * Adicionado estilo visual diferenciado (borda vermelha, XP negativo em vermelho) para missões de punição

* **Tela de Inventário e Loja — Itens e Recompensas:**
  * Criada tabela `CatalogoItens` (catálogo da loja) e `Itens` (inventário do usuário) no schema.sql com seed de 8 itens (poções, cosméticos, recompensas)
  * Criada rota `GET /itens` (protegida) que lista itens do usuário
  * Criada rota `GET /itens/catalogo` (protegida) que lista o catálogo da loja
  * Criada rota `POST /itens/comprar` (protegida) que valida XP, deduz saldo e adiciona ao inventário
  * Registrado roteador de itens em `backend/src/index.ts`
  * Criada `InventarioScreen.tsx` com abas "Meus Itens" (grid 2 colunas) e "Loja" (lista com compra por XP)
  * Adicionada aba "Inventário" na bottom tab navigation em `App.tsx`
*   Esboçada integração Stripe (itens com preço_real retornam mensagem de "em breve")

* **Integração Stripe — Checkout de Itens Reais e Assinatura S-Rank:**
  * Adicionada coluna `stripe_customer_id` na tabela `Users` (schema.sql)
  * Adicionada dependência `stripe` no `package.json`
  * Adicionado content type parser no `index.ts` para preservar raw body do webhook
  * Criado `backend/src/routes/stripe.ts` com rotas: `POST /itens/checkout` (checkout item real), `POST /assinatura/checkout` (checkout assinatura S-Rank), `POST /stripe/webhook` (webhook que processa pagamentos)
  * Registrado stripeRouter no `backend/src/index.ts`
  * Criado `mobile/src/screens/UpgradeScreen.tsx` com tela de upgrade S-Rank (benefícios + botão de assinatura)
  * Adicionada aba "Upgrade" na bottom tab navigation do `App.tsx`
  * Atualizado `InventarioScreen.tsx` para redirecionar ao Stripe checkout ao comprar itens com preço real

* **Masmorras Instantâneas (Pomodoro Timer) — Premium:**
  * Criada tabela `DungeonSessions` no schema.sql
  * Criada rota `POST /dungeons/iniciar` (protegida, S-Rank only) com validação de assinatura e retorno de timestamp de término
  * Criada rota `POST /dungeons/finalizar` (protegida) com cálculo de XP proporcional ao tempo cumprido e level up
  * Criada rota `GET /dungeons/sessoes` (protegida) listando últimas sessões
  * Criado `mobile/src/screens/DungeonScreen.tsx` com timer Pomodoro, seletor de duração (15/25/30/45/60min), pause/resume, barra de progresso, e sessões finalizadas com XP ganho
  * Adicionada aba "Masmorra" no bottom tab navigator em `App.tsx`
  * DungeonScreen bloqueada para usuários free com aviso e botão de upgrade para S-Rank
*   Registrado roteador de dungeons no `backend/src/index.ts`

* **Sistema de Clãs (Premium):**
  * Criada tabela `Clans` (id, nome, descricao, dono_id, rank_medio, criado_em) e `ClanMembers` (clan_id, user_id, cargo, joined_em) no schema.sql
  * Criada rota `POST /clans` (protegida, S-Rank only) — criar clã com validação de nome único e duplicidade
  * Criada rota `POST /clans/:id/entrar` (protegida, S-Rank only) — entrar em clã com cálculo automático de rank médio
  * Criada rota `GET /clans` (protegida) — listar todos os clãs com total de membros
  * Criada rota `GET /clans/:id` (protegida) — detalhes do clã com membros (nome, rank, level, cargo)
  * Criado `mobile/src/screens/ClansScreen.tsx` com view bloqueada para free com upgrade, listagem de clãs, formulário de criação, entrada em clã e tela de detalhes com membros
  * Adicionada aba "Clãs" na bottom tab navigation do `App.tsx`

* **Exército de Sombras (Shadow Army) — Premium:**
  * Criadas tabelas `ShadowArmy` (id, user_id, nome, poder, nivel, desbloqueado_em) e `ShadowSouls` (id, user_id unique, quantidade, updated_em) no schema.sql
  * Criada rota `POST /shadow/coletar` (protegida, S-Rank only) que incrementa almas sombrias do usuário
  * Criada rota `GET /shadow/exercito` (protegida) que lista sombras e saldo de almas do usuário
  * Criada rota `POST /shadow/evoluir` (protegida) que consome almas (custo = nivel * 50), aumenta nivel em +1 e poder em 1.5x
  * Criado `mobile/src/screens/ShadowScreen.tsx` com card de almas sombrias + botão de coleta, FlatList de sombras com botão de evoluir, e bloqueio para usuários free
  * Adicionada aba "Sombras" na bottom tab navigation do `App.tsx`

* **Sistema de Conquistas / Achievements:**
  * Criadas tabelas `Achievements` e `UserAchievements` no schema.sql com 14 conquistas seeds (missões, nível, almas, masmorras, clãs, XP)
  * Criada rota `GET /achievements` (protegida) que verifica automaticamente conquistas do usuário contra seus dados atuais, desbloqueia novas e concede XP + level up
  * Criado `mobile/src/screens/AchievementsScreen.tsx` com FlatList de conquistas, ícones por categoria, cards dourados para desbloqueadas e ocultas (??? ) para bloqueadas
  * Adicionada aba "Conquistas" na bottom tab navigation do `App.tsx`
  * Adicionado banner de notificação ao desbloquear novas conquistas

* **Sistema de Penalidade — Missão de Punição Obrigatória (Refinamento):**
  * Adicionada coluna `penalidade_expira_em` (TIMESTAMPTZ) e `push_token` na tabela Users
  * Cron job atualizado: define expiração de 24h ao ativar modo vermelho, auto-expira penalidades vencidas, e envia push notification via Expo Push API
  * `PATCH /quests/:id` agora limpa `penalidade_expira_em` ao completar punição
  * Rotas premium (dungeons, shadow, clans) bloqueadas durante modo vermelho com mensagem específica
  * `GET /auth/me` agora retorna `penalidade_expira_em`
  * Criada rota `POST /notifications/push-token` (protegida) para registrar token do mobile
  * `HomeScreen` agora busca dados do usuário e exibe banner modo vermelho com timer regressivo (HH:MM:SS)
  * `StatusScreen` aprimorada com timer regressivo no banner modo vermelho
  * Criado hook `useCountdown` reutilizável para contagem regressiva em tempo real
  * Criado serviço `notifications.ts` no mobile para permissão e registro de push token via Expo Notifications
*   `App.tsx` integrado para registrar push token automaticamente ao logar

* **Distribuição de Atributos (Pontos ao Subir de Nível):**
  * Adicionada coluna `pontos_atributo` na tabela `User_Attributes` (schema.sql)
  * `GET /auth/me` expandido para retornar `pontos_atributo`
  * Level-up em quests.ts, dungeons.ts e achievements.ts agora concede 3 pontos de atributo por nível ganho
  * Criada rota `POST /atributos/distribuir` que valida saldo de pontos e aplica em STR/AGI/INT/VIT
  * Criada `DistribuirAtributosScreen.tsx` com botões +/‑ para cada atributo e confirmação via API
  * `StatusScreen.tsx` exibe saldo de pontos e botão "Distribuir" que navega para a nova tela
*   `App.tsx` refatorado com RootStack aninhado (Tabs + DistribuirAtributos como modal)

* **Reset Diário de Missões (Cron Job):**
  * Criada tabela `QuestHistory` no schema.sql para armazenar missões arquivadas
  * Adicionada função `arquivarMissoesPassadas` em `verificar_punicoes.ts` que move missões de dias anteriores para `QuestHistory` (uma vez por dia)
  * Missões de punição pendentes são preservadas (não arquivadas)
  * `POST /quests` explicitado com `CURRENT_DATE` para garantir data correta
  * Frontend `QuestsScreen.tsx` refatorado para agrupar missões por data com cabeçalhos "Hoje", "Ontem" e "dd/mm/aaaa"

* **Sistema de Metas e Recorrência de Missões:**
  * Criada tabela `QuestTemplates` (id, user_id, tipo, descricao, xp_recompensa, frequencia, criado_em) no schema.sql
  * Cron job de reset diário agora gera automaticamente missões a partir dos templates ativos de cada usuário
  * Criadas rotas `GET /quests/templates`, `POST /quests/templates` e `DELETE /quests/templates/:id` no backend
  * Adicionada barra de progresso diário no topo da `QuestsScreen` (ex: "2/5 missões hoje" com barra visual)
  * Adicionada seção de gerenciamento de templates no frontend (criar, listar, excluir templates com seletor de frequência diária/semanal)

* **Meta Diária de XP com Bônus:**
  * Adicionada coluna `meta_xp_diaria` (INTEGER DEFAULT 1000) e `ultimo_bonus_meta_data` (DATE) na tabela Users
  * Criada rota `PATCH /users/meta-xp` para o usuário ajustar sua meta diária de XP
  * `GET /auth/me` expandido para retornar `meta_xp_diaria` e `xp_hoje` (XP acumulado no dia)
  * `PATCH /quests/:id` — lógica de bônus de +10% da meta ao atingir o alvo diário (uma vez por dia), com re-verificação de level up
  * `QuestsScreen` atualizada com barra dupla de progresso (missões + XP diário), botão "Editar" para configurar meta, e indicador de bônus dourado ao completar

* **Gráficos de Evolução do Hunter (Premium):**
  * Criada rota `GET /users/evolucao` no backend que retorna XP diário, missões concluídas e atributos dos últimos 30 dias
  * Criada `EvolutionScreen.tsx` com LineChart de XP por dia, BarChart de missões por dia, e RadarChart customizado (SVG) de atributos (STR/AGI/INT/VIT)
  * Adicionada aba "Evolução" na bottom tab navigation do `App.tsx`
  * Tela bloqueada para usuários free com benefícios e botão de upgrade
  * Seletor de período 7/30 dias nos gráficos
  * Dependências adicionadas: react-native-svg, react-native-chart-kit
