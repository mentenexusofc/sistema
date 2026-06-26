import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/connection";

interface ComprarBody {
  item_id: string;
}

export default async function (app: FastifyInstance) {
  app.get(
    "/itens",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;

      const itens = await db("Itens")
        .where({ user_id: userId })
        .orderBy("adquirido_em", "desc");

      return { itens };
    }
  );

  app.get(
    "/itens/catalogo",
    { preHandler: [app.authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const catalogo = await db("CatalogoItens").orderBy("preco_xp", "asc");

      return { catalogo };
    }
  );

  app.post<{ Body: ComprarBody }>(
    "/itens/comprar",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;
      const { item_id } = request.body;

      if (!item_id || typeof item_id !== "string") {
        return reply.status(400).send({ error: "item_id é obrigatório" });
      }

      const catalogItem = await db("CatalogoItens").where({ id: item_id }).first();

      if (!catalogItem) {
        return reply.status(404).send({ error: "Item não encontrado no catálogo" });
      }

      if (catalogItem.preco_real) {
        return reply.status(400).send({
          error: "Este item só pode ser comprado com dinheiro real (Stripe). Integração em breve.",
        });
      }

      const attrs = await db("User_Attributes").where({ user_id: userId }).first();

      if (!attrs) {
        return reply.status(400).send({ error: "Perfil de atributos não encontrado" });
      }

      if (attrs.xp_total < catalogItem.preco_xp) {
        return reply.status(400).send({
          error: `XP insuficiente. Você tem ${attrs.xp_total} XP, precisa de ${catalogItem.preco_xp} XP.`,
        });
      }

      const [item] = await db("Itens")
        .insert({
          user_id: userId,
          nome: catalogItem.nome,
          tipo: catalogItem.tipo,
          descricao: catalogItem.descricao,
          preco_xp: catalogItem.preco_xp,
          preco_real: catalogItem.preco_real,
        })
        .returning("*");

      await db("User_Attributes")
        .where({ user_id: userId })
        .decrement("xp_total", catalogItem.preco_xp);

      return reply.status(201).send(item);
    }
  );
}
