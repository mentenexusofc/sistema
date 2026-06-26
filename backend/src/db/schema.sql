CREATE TABLE IF NOT EXISTS Users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    rank VARCHAR(20) NOT NULL DEFAULT 'E-Rank',
    assinatura VARCHAR(20) NOT NULL DEFAULT 'free',
    modo_vermelho BOOLEAN NOT NULL DEFAULT FALSE,
    penalidade_expira_em TIMESTAMPTZ,
    push_token VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    meta_xp_diaria INTEGER NOT NULL DEFAULT 1000,
    ultimo_bonus_meta_data DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS User_Attributes (
    user_id UUID PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE,
    str INTEGER NOT NULL DEFAULT 5,
    agi INTEGER NOT NULL DEFAULT 5,
    int INTEGER NOT NULL DEFAULT 5,
    vit INTEGER NOT NULL DEFAULT 5,
    xp_total BIGINT NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    pontos_atributo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    xp_recompensa INTEGER NOT NULL DEFAULT 0,
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    data DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_quests_user_id ON Quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_data ON Quests(data);

CREATE TABLE IF NOT EXISTS CatalogoItens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    preco_xp INTEGER NOT NULL DEFAULT 0,
    preco_real INTEGER
);

CREATE TABLE IF NOT EXISTS Itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    preco_xp INTEGER NOT NULL DEFAULT 0,
    preco_real INTEGER,
    adquirido_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itens_user_id ON Itens(user_id);

CREATE TABLE IF NOT EXISTS DungeonSessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    duracao_minutos INTEGER NOT NULL DEFAULT 25,
    xp_ganho INTEGER NOT NULL DEFAULT 0,
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dungeon_sessions_user_id ON DungeonSessions(user_id);

CREATE TABLE IF NOT EXISTS Clans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT NOT NULL DEFAULT '',
    dono_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    rank_medio VARCHAR(20) NOT NULL DEFAULT 'E-Rank',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ClanMembers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id UUID NOT NULL REFERENCES Clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    cargo VARCHAR(20) NOT NULL DEFAULT 'membro' CHECK (cargo IN ('lider', 'oficial', 'membro')),
    joined_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(clan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clanmembers_clan_id ON ClanMembers(clan_id);
CREATE INDEX IF NOT EXISTS idx_clanmembers_user_id ON ClanMembers(user_id);

CREATE TABLE IF NOT EXISTS ShadowArmy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    poder INTEGER NOT NULL DEFAULT 10,
    nivel INTEGER NOT NULL DEFAULT 1,
    desbloqueado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shadowarmy_user_id ON ShadowArmy(user_id);

CREATE TABLE IF NOT EXISTS ShadowSouls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE UNIQUE,
    quantidade INTEGER NOT NULL DEFAULT 0,
    updated_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    icone VARCHAR(100) NOT NULL DEFAULT 'trophy',
    requisito_tipo VARCHAR(50) NOT NULL,
    requisito_valor INTEGER NOT NULL,
    xp_recompensa INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS UserAchievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES Achievements(id) ON DELETE CASCADE,
    desbloqueado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_userachievements_user_id ON UserAchievements(user_id);

CREATE TABLE IF NOT EXISTS QuestHistory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    xp_recompensa INTEGER NOT NULL DEFAULT 0,
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    data DATE NOT NULL,
    arquivado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questhistory_user_id ON QuestHistory(user_id);
CREATE INDEX IF NOT EXISTS idx_questhistory_data ON QuestHistory(data);

CREATE TABLE IF NOT EXISTS QuestTemplates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    xp_recompensa INTEGER NOT NULL DEFAULT 0,
    frequencia VARCHAR(20) NOT NULL DEFAULT 'diaria' CHECK (frequencia IN ('diaria', 'semanal')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questtemplates_user_id ON QuestTemplates(user_id);

INSERT INTO Achievements (nome, descricao, icone, requisito_tipo, requisito_valor, xp_recompensa) VALUES
  ('Primeiro Passo', 'Complete sua primeira missão', 'quest', 'quests_completed', 1, 100),
  ('Produtivo', 'Complete 10 missões', 'quest', 'quests_completed', 10, 500),
  ('Mestre das Missões', 'Complete 50 missões', 'quest', 'quests_completed', 50, 2000),
  ('Despertar', 'Alcance o level 5', 'level', 'level', 5, 300),
  ('Hunter Rank S', 'Alcance o level 10', 'level', 'level', 10, 1000),
  ('Lenda Viva', 'Alcance o level 25', 'level', 'level', 25, 5000),
  ('Coletor de Almas', 'Colete 10 almas sombrias', 'shadow', 'souls_collected', 10, 300),
  ('Senhor das Sombras', 'Evolua uma sombra 5 vezes', 'shadow', 'evolutions', 5, 1000),
  ('Primeira Masmorra', 'Complete sua primeira masmorra', 'dungeon', 'dungeons_completed', 1, 200),
  ('Veterano de Masmorras', 'Complete 20 masmorras', 'dungeon', 'dungeons_completed', 20, 1500),
  ('União Faz a Força', 'Entre para um clã', 'clan', 'joined_clan', 1, 200),
  ('Líder de Clã', 'Crie seu próprio clã', 'clan', 'created_clan', 1, 500),
  ('Rico em XP', 'Acumule 100.000 de XP total', 'xp', 'xp_total', 100000, 2000),
  ('Milionário de XP', 'Acumule 1.000.000 de XP total', 'xp', 'xp_total', 1000000, 10000)
ON CONFLICT DO NOTHING;

INSERT INTO CatalogoItens (nome, tipo, descricao, preco_xp, preco_real) VALUES
  ('Poção de Cura Menor', 'pocao', 'Recupera 50 HP instantaneamente.', 200, NULL),
  ('Poção de Mana', 'pocao', 'Recupera 30 MP.', 300, NULL),
  ('Elixir de Força', 'pocao', 'Aumenta STR em 2 por 1 hora.', 500, NULL),
  ('Capa das Sombras', 'cosmetico', 'Capa preta com bordas roxas.', 1000, NULL),
  ('Anel do Caçador', 'cosmetico', 'Anel brilhante com gemas azuis.', 800, NULL),
  ('Skin: Runas Antigas', 'cosmetico', 'Altera a aparência da interface com runas.', 1500, NULL),
  ('Voucher Crédito R$10', 'recompensa', 'Resgate por R$10 em crédito real.', 5000, 1000),
  ('Voucher Crédito R$25', 'recompensa', 'Resgate por R$25 em crédito real.', 10000, 2500)
ON CONFLICT DO NOTHING;

ALTER TABLE Users ADD COLUMN IF NOT EXISTS meta_xp_diaria INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE Users ADD COLUMN IF NOT EXISTS ultimo_bonus_meta_data DATE;
