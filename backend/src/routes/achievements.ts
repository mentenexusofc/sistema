import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/connection";

export default async function (app: FastifyInstance) {
  app.get(
    "/achievements",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;

      const user = await db("Users").where({ id: userId }).first();
      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }

      const attrs = await db("User_Attributes").where({ user_id: userId }).first();
      const questsCount = await db("Quests").where({ user_id: userId, concluida: true }).count('* as count').first();
      const dungeonsCount = await db("DungeonSessions").where({ user_id: userId, concluida: true }).count('* as count').first();
      const souls = await db("ShadowSouls").where({ user_id: userId }).first();
      const shadowArmy = await db("ShadowArmy").where({ user_id: userId });
      const clanMember = await db("ClanMembers").where({ user_id: userId }).first();
      const clanOwner = await db("Clans").where({ dono_id: userId }).first();
      const totalEvolutions = shadowArmy.reduce((sum: number, s: any) => sum + (s.nivel - 1), 0);

      const completedQuests = parseInt(String(questsCount?.count || "0"), 10);
      const completedDungeons = parseInt(String(dungeonsCount?.count || "0"), 10);
      const soulsQuantity = souls?.quantidade || 0;

      const userStats: Record<string, number> = {
        quests_completed: completedQuests,
        level: attrs?.level || 1,
        souls_collected: soulsQuantity,
        evolutions: totalEvolutions,
        dungeons_completed: completedDungeons,
        joined_clan: clanMember ? 1 : 0,
        created_clan: clanOwner ? 1 : 0,
        xp_total: attrs?.xp_total || 0,
      };

      const allAchievements = await db("Achievements").select("*");

      const unlocked = await db("UserAchievements").where({ user_id: userId });
      const unlockedAchievementIds = new Set(unlocked.map(u => u.achievement_id));
      const newlyUnlocked: any[] = [];

      for (const achievement of allAchievements) {
        if (!unlockedAchievementIds.has(achievement.id)) {
          const currentValue = userStats[achievement.requisito_tipo] || 0;
          if (currentValue >= achievement.requisito_valor) {
            newlyUnlocked.push({
              user_id: userId,
              achievement_id: achievement.id,
            });
          }
        }
      }

      if (newlyUnlocked.length > 0) {
        await db("UserAchievements").insert(newlyUnlocked);

        const totalXpReward = newlyUnlocked.reduce((sum, nu) => {
          const achievement = allAchievements.find(a => a.id === nu.achievement_id);
          return sum + (achievement?.xp_recompensa || 0);
        }, 0);

        if (totalXpReward > 0) {
          await db("User_Attributes")
            .where({ user_id: userId })
            .increment("xp_total", totalXpReward);

          const updatedAttrs = await db("User_Attributes").where({ user_id: userId }).first();
          if (updatedAttrs) {
            let { level, xp_total } = updatedAttrs;
            let leveledUp = false;
            while (xp_total >= level * 1000) {
              xp_total -= level * 1000;
              level++;
              leveledUp = true;
            }
            if (leveledUp) {
              const levelsGained = level - updatedAttrs.level;
              await db("User_Attributes")
                .where({ user_id: userId })
                .update({ level, xp_total })
                .increment("pontos_atributo", levelsGained * 3);
            }
          }
        }
      }

      const finalAchievements = await db("Achievements")
        .select("Achievements.*", "UserAchievements.desbloqueado_em")
        .leftJoin("UserAchievements", function () {
          this.on("Achievements.id", "=", "UserAchievements.achievement_id")
            .andOn("UserAchievements.user_id", "=", db.raw("?", [userId]));
        })
        .orderBy("Achievements.requisito_valor", "asc");

      return {
        achievements: finalAchievements,
        novas_conquistas: newlyUnlocked.length,
      };
    }
  );
}
