# Mapa do Sistema (Solo Leveling SaaS)

## 📌 Arquitetura Geral (Stack Definitiva)

* **Frontend Mobile:** React Native (Expo)
* **Backend:** Node.js (Fastify)
* **Banco de Dados:** PostgreSQL
* **Gateway de Pagamento:** Stripe

## 🗄️ Tabelas do Banco de Dados Atuais

* `Users` — id (UUID), nome, email (unique), rank, assinatura, modo_vermelho, penalidade_expira_em, push_token, stripe_customer_id, meta_xp_diaria, ultimo_bonus_meta_data, criado_em
* `User_Attributes` — user_id (FK), str, agi, int, vit, xp_total, level, pontos_atributo
* `Quests` — id (UUID), user_id (FK), tipo, descricao, xp_recompensa, concluida, data
* `CatalogoItens` — id (UUID), nome, tipo, descricao, preco_xp, preco_real
* `Itens` — id (UUID), user_id (FK), nome, tipo, descricao, preco_xp, preco_real, adquirido_em
* `DungeonSessions` — id (UUID), user_id (FK), duracao_minutos, xp_ganho, concluida, criada_em
* `Clans` — id (UUID), nome (unique), descricao, dono_id (FK Users), rank_medio, criado_em
* `ClanMembers` — id (UUID), clan_id (FK), user_id (FK), cargo (lider/oficial/membro), joined_em
* `ShadowArmy` — id (UUID), user_id (FK), nome, poder, nivel, desbloqueado_em
* `ShadowSouls` — id (UUID), user_id (FK, unique), quantidade, updated_em
* `Achievements` — id (UUID), nome (unique), descricao, icone, requisito_tipo, requisito_valor, xp_recompensa
* `UserAchievements` — id (UUID), user_id (FK), achievement_id (FK), desbloqueado_em, UNIQUE(user_id, achievement_id)
* `QuestHistory` — id (UUID), user_id (FK), tipo, descricao, xp_recompensa, concluida, data, arquivado_em
* `QuestTemplates` — id (UUID), user_id (FK), tipo, descricao, xp_recompensa, frequencia (diaria/semanal), criado_em

## 🛣️ Rotas da API Principais

* `GET /health` -> Health check
* `POST /users` -> Criar novo usuário (com atributos iniciais e senha)
* `POST /auth/login` -> Autenticação (email + senha) -> retorna JWT
* `GET /auth/me` -> (protegida) Retorna dados do usuário autenticado via token
* `GET /quests` -> (protegida) Lista missões do usuário autenticado
* `POST /quests` -> (protegida) Cria nova missão para o usuário
* `PATCH /quests/:id` -> (protegida) Alterna status concluída da missão
* `DELETE /quests/:id` -> (protegida) Remove uma missão
* `GET /quests/templates` -> (protegida) Lista templates de missões recorrentes do usuário
* `POST /quests/templates` -> (protegida) Cria novo template (tipo, descricao, xp_recompensa, frequencia)
* `DELETE /quests/templates/:id` -> (protegida) Remove um template
* `GET /itens` -> (protegida) Lista itens do usuário
* `GET /itens/catalogo` -> (protegida) Lista catálogo da loja
* `POST /itens/comprar` -> (protegida) Compra item com XP do catálogo
* `POST /dungeons/iniciar` -> (protegida, S-Rank only) Inicia sessão de masmorra Pomodoro, retorna timestamp de término
* `POST /dungeons/finalizar` -> (protegida) Finaliza sessão e concede XP proporcional
* `GET /dungeons/sessoes` -> (protegida) Lista últimas sessões do usuário
* `POST /itens/checkout` -> (protegida) Cria sessão Stripe para item com preço real
* `POST /assinatura/checkout` -> (protegida) Cria sessão Stripe para assinatura S-Rank
* `POST /stripe/webhook` -> (pública) Webhook Stripe que processa confirmação de pagamento
* `POST /clans` -> (protegida, S-Rank only) Criar novo clã
* `POST /clans/:id/entrar` -> (protegida, S-Rank only) Entrar em um clã
* `GET /clans` -> (protegida) Listar todos os clãs com contagem de membros
* `GET /clans/:id` -> (protegida) Detalhes do clã com membros
* `POST /shadow/coletar` -> (protegida, S-Rank only) Coleta almas sombrias
* `GET /shadow/exercito` -> (protegida) Lista sombras e almas do usuário
* `POST /shadow/evoluir` -> (protegida) Evolui uma sombra consumindo almas sombrias
* `GET /achievements` -> (protegida) Lista todas as conquistas com status do usuário (desbloqueio automático + recompensa de XP)
* `POST /notifications/push-token` -> (protegida) Registra token Expo Push para notificações
* `POST /atributos/distribuir` -> (protegida) Distribui pontos de atributo (STR/AGI/INT/VIT) do saldo disponível
* `PATCH /users/meta-xp` -> (protegida) Ajusta a meta diária de XP do usuário
* `GET /users/evolucao` -> (protegida, S-Rank only) Retorna dados agregados dos últimos 30 dias (XP diário, missões concluídas, atributos)

## 📁 Arquivos Chave e Suas Funções

* `docker-compose.yml` -> Orquestração dos serviços (backend + postgres)
* `backend/src/index.ts` -> Servidor Fastify (ponto de entrada da API)
* `backend/src/db/schema.sql` -> DDL das tabelas Users, User_Attributes e Quests
* `backend/src/db/connection.ts` -> Pool de conexão Knex + PostgreSQL + migração automática
* `backend/src/routes/users.ts` -> Roteador de usuários (POST /users)
* `backend/src/routes/quests.ts` -> Roteador de missões (GET e POST /quests, bloqueio de modo vermelho)
* `backend/src/cron/verificar_punicoes.ts` -> Cron job que verifica missões pendentes, ativa modo vermelho, e gera missões a partir de templates
* `backend/Dockerfile` -> Build da imagem do backend
* `mobile/App.tsx` -> Componente raiz do app React Native (navegação auth + bottom tabs)
* `mobile/src/screens/QuestsScreen.tsx` -> Tela de lista de missões (Quest Log)
* `mobile/app.json` -> Configuração do Expo
* `mobile/src/services/api.ts` -> Cliente axios configurado com interceptador JWT
* `mobile/src/screens/LoginScreen.tsx` -> Tela de login com email/senha e armazenamento de token
* `mobile/src/screens/HomeScreen.tsx` -> Tela inicial pós-login (placeholder)
* `mobile/src/screens/StatusScreen.tsx` -> Tela de status do hunter (nível, XP, atributos, rank)
* `backend/src/routes/itens.ts` -> Roteador de inventário e loja (GET /itens, GET /itens/catalogo, POST /itens/comprar)
* `mobile/src/screens/InventarioScreen.tsx` -> Tela de inventário com grid de itens e aba de loja
* `mobile/src/screens/UpgradeScreen.tsx` -> Tela de upgrade para plano S-Rank Premium com checkout Stripe
* `backend/src/routes/stripe.ts` -> Rotas de checkout Stripe (itens reais + assinatura) e webhook de pagamento
* `backend/src/routes/dungeons.ts` -> Rotas de masmorra instantânea (iniciar/finalizar Pomodoro com verificação S-Rank)
* `mobile/src/screens/DungeonScreen.tsx` -> Tela de timer Pomodoro com seletor de duração, progresso, bloqueio para free
* `backend/src/routes/clans.ts` -> Rotas de clãs (criar, entrar, listar, detalhes)
* `mobile/src/screens/ClansScreen.tsx` -> Tela de clãs com listagem, criação, entrada e detalhes dos membros
* `backend/src/routes/shadow.ts` -> Rotas do exército de sombras (coletar almas, listar, evoluir)
* `mobile/src/screens/ShadowScreen.tsx` -> Tela do exército de sombras com coleta de almas e evolução
* `backend/src/routes/achievements.ts` -> Rota de conquistas (GET /achievements com detecção automática e recompensa)
* `mobile/src/screens/AchievementsScreen.tsx` -> Tela de conquistas com cards bloqueados/desbloqueados e recompensa em XP
* `mobile/src/hooks/useCountdown.ts` -> Hook reutilizável para contagem regressiva (timer HH:MM:SS)
* `mobile/src/services/notifications.ts` -> Serviço de registro de push token via Expo Notifications
* `backend/src/routes/notifications.ts` -> Rota para registrar push token do dispositivo
* `backend/src/routes/atributos.ts` -> Rota para distribuir pontos de atributo (POST /atributos/distribuir)
* `mobile/src/screens/DistribuirAtributosScreen.tsx` -> Tela de distribuição de atributos com botões +/‑ e confirmação
* `mobile/src/screens/EvolutionScreen.tsx` -> Tela de gráficos de evolução (XP diário, radar de atributos, missões por dia) com bloqueio para free

---

## 🎯 Escopo do Projeto (SaaS Solo Leveling)

### Planos de Assinatura
* **Free (E-Rank):** Missões diárias básicas, tela de status simples.
* **Premium (S-Rank):** Masmorras instantâneas, sistema de clãs, exército de sombras, gráficos de evolução.

### Telas Planejadas
1. **Login / Paywall ("O Despertar")** – Tela de login com bloqueio se assinatura vencida.
2. **Status (Coração do Sistema)** – Nível, XP, fadiga, atributos (STR/AGI/INT/VIT), distribuição de pontos.
3. **Missões (Quest Log)** – Diárias, masmorras instantâneas (Pomodoro), missões de mudança de classe.
4. **Inventário & Loja** – Itens cosméticos, poções, recompensas reais cadastradas pelo usuário.
5. **Sistema de Penalidade** – Modo vermelho + missão de punição se falhar nas diárias.

### Funcionalidades Críticas (Backend)
* Validação de tarefas (API Google Calendar, Strava, ou foto)
* Cálculo de XP dinâmico
* Cron job de renovação diária (reset missões + aplicar penalidades)
* Webhook de pagamento (libera S-Rank automaticamente)
