import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/connection";

interface ColetarBody {
  quantidade?: number;
}

interface EvoluirBody {
  shadow_id: string;
}

export default async function (app: FastifyInstance) {
  app.post<{ Body: ColetarBody }>(
    "/shadow/coletar",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;

      const user = await db("Users").where({ id: userId }).first();
      if (!user || user.assinatura !== "s-rank") {
        return reply.status(403).send({ error: "Apenas usuários S-Rank podem coletar almas sombrias." });
      }
      if (user.modo_vermelho) {
        return reply.status(403).send({ error: "Modo vermelho ativo. Complete a missão de punição primeiro." });
      }

      const quantidade = request.body.quantidade ?? 1;
      if (quantidade < 1 || quantidade > 100) {
        return reply.status(400).send({ error: "Quantidade deve ser entre 1 e 100." });
      }

      const existente = await db("ShadowSouls").where({ user_id: userId }).first();
      if (existente) {
        await db("ShadowSouls").where({ user_id: userId }).increment("quantidade", quantidade).update({ updated_em: db.fn.now() });
      } else {
        await db("ShadowSouls").insert({ user_id: userId, quantidade });
      }

      const souls = await db("ShadowSouls").where({ user_id: userId }).first();
      return reply.status(201).send({ souls: { quantidade: souls.quantidade } });
    }
  );

  app.get(
    "/shadow/exercito",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;

      const sombras = await db("ShadowArmy").where({ user_id: userId }).orderBy("desbloqueado_em", "desc");
      const souls = await db("ShadowSouls").where({ user_id: userId }).first();

      return {
        sombras,
        almas_sombrias: souls?.quantidade ?? 0,
      };
    }
  );

  app.post<{ Body: EvoluirBody }>(
    "/shadow/evoluir",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;

      const user = await db("Users").where({ id: userId }).first();
      if (user?.modo_vermelho) {
        return reply.status(403).send({ error: "Modo vermelho ativo. Complete a missão de punição primeiro." });
      }

      const { shadow_id } = request.body;

      if (!shadow_id || typeof shadow_id !== "string") {
        return reply.status(400).send({ error: "shadow_id é obrigatório." });
      }

      const sombra = await db("ShadowArmy").where({ id: shadow_id, user_id: userId }).first();
      if (!sombra) {
        return reply.status(404).send({ error: "Sombra não encontrada." });
      }

      const souls = await db("ShadowSouls").where({ user_id: userId }).first();
      const custo = sombra.nivel * 50;
      if (!souls || souls.quantidade < custo) {
        return reply.status(400).send({ error: `Você precisa de ${custo} almas sombrias para evoluir esta sombra.` });
      }

      await db("ShadowSouls").where({ user_id: userId }).decrement("quantidade", custo);
      const novoNivel = sombra.nivel + 1;
      const novoPoder = Math.round(sombra.poder * 1.5);

      const [sombraAtualizada] = await db("ShadowArmy")
        .where({ id: shadow_id })
        .update({ nivel: novoNivel, poder: novoPoder })
        .returning("*");

      const soulsRestantes = await db("ShadowSouls").where({ user_id: userId }).first();

      return reply.send({
        sombra: sombraAtualizada,
        almas_sombrias_restantes: soulsRestantes?.quantidade ?? 0,
      });
    }
  );
}
