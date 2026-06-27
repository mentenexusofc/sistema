import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/connection";

interface DistribuirBody {
  str?: number;
  agi?: number;
  int?: number;
  vit?: number;
}

export default async function (app: FastifyInstance) {
  app.post<{ Body: DistribuirBody }>(
    "/atributos/distribuir",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { str = 0, agi = 0, int = 0, vit = 0 } = request.body;

      if ([str, agi, int, vit].some((v) => !Number.isInteger(v) || v < 0)) {
        return reply.status(400).send({ error: "Todos os valores devem ser inteiros não negativos" });
      }

      const totalDesejado = str + agi + int + vit;
      if (totalDesejado === 0) {
        return reply.status(400).send({ error: "Distribua pelo menos 1 ponto" });
      }

      const attrs = await db("User_Attributes").where({ user_id: userId }).first();
      if (!attrs) {
        return reply.status(404).send({ error: "Atributos não encontrados" });
      }

      if (totalDesejado > attrs.pontos_atributo) {
        return reply.status(400).send({
          error: `Você tem apenas ${attrs.pontos_atributo} ponto(s) disponível(is)`,
        });
      }

      await db("User_Attributes")
        .where({ user_id: userId })
        .update({
          str: attrs.str + str,
          agi: attrs.agi + agi,
          int: attrs.int + int,
          vit: attrs.vit + vit,
          pontos_atributo: attrs.pontos_atributo - totalDesejado,
        });

      const updated = await db("User_Attributes").where({ user_id: userId }).first();

      return {
        pontos_restantes: updated.pontos_atributo,
        str: updated.str,
        agi: updated.agi,
        int: updated.int,
        vit: updated.vit,
      };
    }
  );
}
