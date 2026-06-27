import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/connection";

interface CreateClanBody {
  nome: string;
  descricao?: string;
}

export default async function (app: FastifyInstance) {
  app.post<{ Body: CreateClanBody }>(
    "/clans",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;

      const user = await db("Users").where({ id: userId }).first();
      if (!user || user.assinatura !== "s-rank") {
        return reply.status(403).send({ error: "Apenas usuários S-Rank podem criar clãs." });
      }
      if (user.modo_vermelho) {
        return reply.status(403).send({ error: "Modo vermelho ativo. Complete a missão de punição primeiro." });
      }

      const { nome, descricao } = request.body;

      if (!nome || typeof nome !== "string" || nome.trim().length < 2) {
        return reply.status(400).send({ error: "Nome do clã deve ter pelo menos 2 caracteres." });
      }

      const existente = await db("Clans").where({ nome: nome.trim() }).first();
      if (existente) {
        return reply.status(409).send({ error: "Já existe um clã com este nome." });
      }

      const membroAtual = await db("ClanMembers").where({ user_id: userId }).first();
      if (membroAtual) {
        return reply.status(400).send({ error: "Você já pertence a um clã." });
      }

      const [clan] = await db("Clans")
        .insert({ nome: nome.trim(), descricao: descricao?.trim() || "", dono_id: userId })
        .returning("*");

      await db("ClanMembers").insert({
        clan_id: clan.id,
        user_id: userId,
        cargo: "lider",
      });

      return reply.status(201).send({ clan });
    }
  );

  app.post<{ Params: { id: string } }>(
    "/clans/:id/entrar",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { id } = request.params;

      const user = await db("Users").where({ id: userId }).first();
      if (!user || user.assinatura !== "s-rank") {
        return reply.status(403).send({ error: "Apenas usuários S-Rank podem entrar em clãs." });
      }
      if (user.modo_vermelho) {
        return reply.status(403).send({ error: "Modo vermelho ativo. Complete a missão de punição primeiro." });
      }

      const clan = await db("Clans").where({ id }).first();
      if (!clan) {
        return reply.status(404).send({ error: "Clã não encontrado." });
      }

      const membroAtual = await db("ClanMembers").where({ user_id: userId }).first();
      if (membroAtual) {
        return reply.status(400).send({ error: "Você já pertence a um clã." });
      }

      const [member] = await db("ClanMembers")
        .insert({ clan_id: id, user_id: userId, cargo: "membro" })
        .returning("*");

      await atualizarRankMedio(id);

      return reply.status(201).send({ member });
    }
  );

  app.get<{ Params: { id: string } }>(
    "/clans/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params;

      const clan = await db("Clans").where({ id }).first();
      if (!clan) {
        return reply.status(404).send({ error: "Clã não encontrado." });
      }

      const membros = await db("ClanMembers")
        .join("Users", "ClanMembers.user_id", "Users.id")
        .join("User_Attributes", "Users.id", "User_Attributes.user_id")
        .where("ClanMembers.clan_id", id)
        .select(
          "ClanMembers.user_id as id",
          "Users.nome",
          "Users.rank",
          "ClanMembers.cargo",
          "ClanMembers.joined_em",
          "User_Attributes.level"
        )
        .orderBy("ClanMembers.joined_em", "asc");

      return { clan, membros };
    }
  );

  app.get(
    "/clans",
    { preHandler: [app.authenticate] },
    async (_request, reply) => {
      const clans = await db("Clans")
        .leftJoin("ClanMembers", "Clans.id", "ClanMembers.clan_id")
        .select(
          "Clans.*",
          db.raw("COUNT(ClanMembers.id)::int AS total_membros")
        )
        .groupBy("Clans.id")
        .orderBy("Clans.criado_em", "desc");

      return { clans };
    }
  );
}

async function atualizarRankMedio(clanId: string) {
  const result = await db("ClanMembers")
    .join("Users", "ClanMembers.user_id", "Users.id")
    .where("ClanMembers.clan_id", clanId)
    .select(db.raw("AVG(CASE WHEN Users.rank = 'S-Rank' THEN 5 WHEN Users.rank = 'A-Rank' THEN 4 WHEN Users.rank = 'B-Rank' THEN 3 WHEN Users.rank = 'C-Rank' THEN 2 ELSE 1 END) as media"));

  if (result.length > 0 && result[0].media) {
    const media = Math.round(result[0].media);
    const rankMedio = media >= 5 ? "S-Rank" : media >= 4 ? "A-Rank" : media >= 3 ? "B-Rank" : media >= 2 ? "C-Rank" : "E-Rank";
    await db("Clans").where({ id: clanId }).update({ rank_medio: rankMedio });
  }
}
