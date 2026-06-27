import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/connection";

interface CreateQuestBody {
  tipo: string;
  descricao: string;
  xp_recompensa?: number;
}

interface QuestParams {
  id: string;
}

interface CreateTemplateBody {
  tipo: string;
  descricao: string;
  xp_recompensa?: number;
  frequencia?: string;
}

export default async function (app: FastifyInstance) {
  app.get(
    "/quests",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;

      const quests = await db("Quests")
        .where({ user_id: userId })
        .orderBy("data", "desc")
        .orderBy("criado_em", "desc");

      return { quests };
    }
  );

  app.post<{ Body: CreateQuestBody }>(
    "/quests",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { tipo, descricao, xp_recompensa } = request.body;

      if (!tipo || typeof tipo !== "string" || tipo.trim().length === 0) {
        return reply.status(400).send({ error: "Tipo é obrigatório" });
      }

      if (!descricao || typeof descricao !== "string" || descricao.trim().length === 0) {
        return reply.status(400).send({ error: "Descrição é obrigatória" });
      }

      const user = await db("Users").where({ id: userId }).first();

      if (user?.modo_vermelho && tipo.trim() !== "punição") {
        return reply.status(403).send({
          error: "Modo vermelho ativo. Complete a missão de punição antes de criar novas missões.",
        });
      }

      const [quest] = await db("Quests")
        .insert({
          user_id: userId,
          tipo: tipo.trim(),
          descricao: descricao.trim(),
          xp_recompensa: xp_recompensa ?? 0,
          data: db.raw("CURRENT_DATE"),
        })
        .returning(["id", "tipo", "descricao", "xp_recompensa", "concluida", "data"]);

      return reply.status(201).send(quest);
    }
  );

  app.patch<{ Params: QuestParams }>(
    "/quests/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { id } = request.params;

      const currentQuest = await db("Quests")
        .where({ id, user_id: userId })
        .first();

      if (!currentQuest) {
        return reply.status(404).send({ error: "Missão não encontrada" });
      }

      const [quest] = await db("Quests")
        .where({ id, user_id: userId })
        .update({ concluida: db.raw("NOT concluida") })
        .returning("*");

      if (quest.concluida && currentQuest.tipo === "punição") {
        await db("Users").where({ id: userId }).update({ modo_vermelho: false, penalidade_expira_em: null });
      }

      const xp = currentQuest.xp_recompensa;

      if (quest.concluida) {
        await db("User_Attributes")
          .where({ user_id: userId })
          .increment("xp_total", xp);
      } else {
        await db("User_Attributes")
          .where({ user_id: userId })
          .decrement("xp_total", xp);
      }

      const attrs = await db("User_Attributes")
        .where({ user_id: userId })
        .first();

      if (attrs) {
        let { level, xp_total } = attrs;
        let leveledUp = false;

        while (xp_total >= level * 1000) {
          xp_total -= level * 1000;
          level++;
          leveledUp = true;
        }

        if (leveledUp) {
          const levelsGained = level - attrs.level;
          await db("User_Attributes")
            .where({ user_id: userId })
            .update({ level, xp_total })
            .increment("pontos_atributo", levelsGained * 3);
        }
      }

      let bonusGranted = false;

      if (quest.concluida) {
        const user = await db("Users").where({ id: userId }).first();

        if (user) {
          const hojeResult = await db("Quests")
            .where({ user_id: userId, concluida: true })
            .whereRaw("data = CURRENT_DATE")
            .sum("xp_recompensa as total")
            .first();

          const xpHoje = parseInt(String(hojeResult?.total || 0), 10);

          if (xpHoje >= user.meta_xp_diaria) {
            const today = new Date().toISOString().split("T")[0];
            const lastBonus = user.ultimo_bonus_meta_data
              ? new Date(user.ultimo_bonus_meta_data).toISOString().split("T")[0]
              : null;

            if (lastBonus !== today) {
              const bonusXp = Math.round(user.meta_xp_diaria * 0.1);

              await db("User_Attributes")
                .where({ user_id: userId })
                .increment("xp_total", bonusXp);

              await db("Users")
                .where({ id: userId })
                .update({ ultimo_bonus_meta_data: db.raw("CURRENT_DATE") });

              bonusGranted = true;

              const attrs2 = await db("User_Attributes")
                .where({ user_id: userId })
                .first();

              if (attrs2) {
                let { level, xp_total } = attrs2;
                let leveledUp = false;

                while (xp_total >= level * 1000) {
                  xp_total -= level * 1000;
                  level++;
                  leveledUp = true;
                }

                if (leveledUp) {
                  const levelsGained = level - attrs2.level;
                  await db("User_Attributes")
                    .where({ user_id: userId })
                    .update({ level, xp_total })
                    .increment("pontos_atributo", levelsGained * 3);
                }
              }
            }
          }
        }
      }

      return { quest, bonusGranted };
    }
  );

  app.delete<{ Params: QuestParams }>(
    "/quests/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { id } = request.params;

      const deleted = await db("Quests").where({ id, user_id: userId }).del();

      if (deleted === 0) {
        return reply.status(404).send({ error: "Missão não encontrada" });
      }

      return reply.status(204).send();
    }
  );

  // --- Rotas de Templates ---

  app.get(
    "/quests/templates",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;

      const templates = await db("QuestTemplates")
        .where({ user_id: userId })
        .orderBy("criado_em", "desc");

      return { templates };
    }
  );

  app.post<{ Body: CreateTemplateBody }>(
    "/quests/templates",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { tipo, descricao, xp_recompensa, frequencia } = request.body;

      if (!tipo || typeof tipo !== "string" || tipo.trim().length === 0) {
        return reply.status(400).send({ error: "Tipo é obrigatório" });
      }

      if (!descricao || typeof descricao !== "string" || descricao.trim().length === 0) {
        return reply.status(400).send({ error: "Descrição é obrigatória" });
      }

      const freq = frequencia === "semanal" ? "semanal" : "diaria";

      const [template] = await db("QuestTemplates")
        .insert({
          user_id: userId,
          tipo: tipo.trim(),
          descricao: descricao.trim(),
          xp_recompensa: xp_recompensa ?? 0,
          frequencia: freq,
        })
        .returning(["id", "tipo", "descricao", "xp_recompensa", "frequencia", "criado_em"]);

      return reply.status(201).send(template);
    }
  );

  app.delete<{ Params: QuestParams }>(
    "/quests/templates/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { id } = request.params;

      const deleted = await db("QuestTemplates").where({ id, user_id: userId }).del();

      if (deleted === 0) {
        return reply.status(404).send({ error: "Template não encontrado" });
      }

      return reply.status(204).send();
    }
  );
}
