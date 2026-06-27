import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/connection";

interface PushTokenBody {
  push_token: string;
}

export default async function (app: FastifyInstance) {
  app.post<{ Body: PushTokenBody }>(
    "/notifications/push-token",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { push_token } = request.body;

      if (!push_token || typeof push_token !== "string") {
        return reply.status(400).send({ error: "push_token é obrigatório." });
      }

      await db("Users").where({ id: userId }).update({ push_token });

      return reply.send({ ok: true });
    }
  );
}
