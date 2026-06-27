import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/connection";

interface IniciarBody {
  duracao_minutos?: number;
}

interface FinalizarBody {
  session_id: string;
}

export default async function (app: FastifyInstance) {
  app.post<{ Body: IniciarBody }>(
    "/dungeons/iniciar",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;

      const user = await db("Users").where({ id: userId }).first();
      if (!user || user.assinatura !== "s-rank") {
        return reply.status(403).send({ error: "Apenas usuários S-Rank podem iniciar masmorras." });
      }
      if (user.modo_vermelho) {
        return reply.status(403).send({ error: "Modo vermelho ativo. Complete a missão de punição primeiro." });
      }

      const duracao_minutos = request.body.duracao_minutos ?? 25;

      if (duracao_minutos < 1 || duracao_minutos > 120) {
        return reply.status(400).send({ error: "Duração deve ser entre 1 e 120 minutos." });
      }

      const [session] = await db("DungeonSessions")
        .insert({ user_id: userId, duracao_minutos, xp_ganho: 0 })
        .returning(["id", "duracao_minutos", "criada_em"]);

      const termina_em = new Date(
        new Date(session.criada_em).getTime() + duracao_minutos * 60 * 1000
      ).toISOString();

      return reply.status(201).send({ session, termina_em });
    }
  );

  app.post<{ Body: FinalizarBody }>(
    "/dungeons/finalizar",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { session_id } = request.body;

      if (!session_id || typeof session_id !== "string") {
        return reply.status(400).send({ error: "session_id é obrigatório." });
      }

      const session = await db("DungeonSessions")
        .where({ id: session_id, user_id: userId })
        .first();

      if (!session) {
        return reply.status(404).send({ error: "Sessão não encontrada." });
      }

      if (session.concluida) {
        return reply.status(400).send({ error: "Sessão já foi finalizada." });
      }

      const agora = new Date();
      const criadaEm = new Date(session.criada_em);
      const tempoDecorridoMs = agora.getTime() - criadaEm.getTime();
      const tempoDecorridoMin = Math.max(0, tempoDecorridoMs / 60000);
      const proporcao = Math.min(1, tempoDecorridoMin / session.duracao_minutos);
      const xp_ganho = Math.round(session.duracao_minutos * 10 * proporcao);

      await db("DungeonSessions")
        .where({ id: session_id })
        .update({ concluida: true, xp_ganho });

      await db("User_Attributes")
        .where({ user_id: userId })
        .increment("xp_total", xp_ganho);

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

      return reply.send({
        session: { ...session, concluida: true, xp_ganho },
        xp_recebido: xp_ganho,
        tempo_cumprido_min: Math.round(tempoDecorridoMin * 10) / 10,
      });
    }
  );

  app.get(
    "/dungeons/sessoes",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;

      const sessoes = await db("DungeonSessions")
        .where({ user_id: userId })
        .orderBy("criada_em", "desc")
        .limit(20);

      return { sessoes };
    }
  );
}
