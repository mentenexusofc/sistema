# Próximo Passo do Desenvolvimento

## 🎯 Meta Atual: Gráficos de Evolução do Hunter (Premium) — Concluído

Rota `GET /users/evolucao`, EvolutionScreen com LineChart (XP diário), BarChart (missões por dia) e RadarChart (atributos STR/AGI/INT/VIT), aba "Evolução" no bottom tab navigator bloqueada para free.

## 🛠️ Próximo passo sugerido: Validação de Tarefas (Integração com APIs Externas)

Atualmente o usuário pode criar qualquer missão manualmente sem validação real. Adicionar integração com APIs externas para validar conclusão de tarefas:
- Google Calendar API (verificar eventos concluídos)
- Strava API (verificar atividades físicas)
- Upload de foto com comprovação

### O que fazer:

1. Criar tabela `Integracoes` no schema.sql (user_id, provider, access_token, refresh_token, expires_at)
2. Criar rota `POST /integracoes/google` para vincular conta Google (OAuth)
3. Criar rota `POST /integracoes/strava` para vincular conta Strava (OAuth)
4. Criar rota `POST /quests/validar/:id` que dispara validação automática baseada no tipo da missão
5. Criar `mobile/src/screens/IntegracoesScreen.tsx` com botões de vincular contas
6. Adicionar aba "Integrações" (ou acesso via Configurações)

### 📂 Arquivos que serão afetados:

* `backend/src/db/schema.sql` (nova tabela Integracoes)
* `backend/src/routes/integracoes.ts` (novo roteador)
* `backend/src/routes/quests.ts` (nova rota de validação)
* `mobile/src/screens/IntegracoesScreen.tsx` (nova tela)
* `mobile/App.tsx` (nova rota/aba)
* `contexto/mapa_sistema.md` (nova tabela, rotas e tela)
* `contexto/progresso.md` (atualizar ao concluir)
