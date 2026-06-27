import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import db from "../db/connection";

interface CreateUserBody {
  nome: string;
  email: string;
  senha: string;
}

interface MetaXpBody {
  meta_xp_diaria: number;
}

export default async function (app: FastifyInstance) {
  app.post("/seed", async (request, reply) => {
    const existing = await db("Users").where({ email: "mentenexus.ia@gmail.com" }).first();
    if (existing) {
      return reply.status(200).send({ message: "Admin já existe" });
    }

    const senha_hash = await bcrypt.hash("admin", 10);
    const result = await db.transaction(async (trx) => {
      const [user] = await trx("Users")
        .insert({
          nome: "Admin",
          email: "mentenexus.ia@gmail.com",
          senha_hash,
          rank: "S-Rank",
          assinatura: "s-rank",
        })
        .returning(["id", "nome", "email", "rank", "assinatura", "criado_em"]);

      await trx("User_Attributes").insert({ user_id: user.id, str: 10, agi: 10, int: 10, vit: 10 });

      return user;
    });

    return reply.status(201).send({ message: "Admin criado", user: result });
  });

  app.post<{ Body: CreateUserBody }>("/users", async (request, reply) => {
    const { nome, email, senha } = request.body;

    if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
      return reply.status(400).send({ error: "Nome é obrigatório" });
    }

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return reply.status(400).send({ error: "Email é obrigatório" });
    }

    if (!senha || typeof senha !== "string" || senha.length < 6) {
      return reply.status(400).send({ error: "Senha deve ter no mínimo 6 caracteres" });
    }

    const existing = await db("Users").where({ email: email.trim() }).first();
    if (existing) {
      return reply.status(409).send({ error: "Email já cadastrado" });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const result = await db.transaction(async (trx) => {
      const [user] = await trx("Users")
        .insert({ nome: nome.trim(), email: email.trim(), senha_hash })
        .returning(["id", "nome", "email", "rank", "assinatura", "criado_em"]);

      await trx("User_Attributes").insert({ user_id: user.id });

      return user;
    });

    return reply.status(201).send(result);
  });

  app.get(
    "/users/evolucao",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;

      const user = await db("Users").where({ id: userId }).first();
      if (!user || user.assinatura !== "s-rank") {
        return reply.status(403).send({ error: "Apenas usuários S-Rank podem acessar gráficos de evolução." });
      }
      if (user.modo_vermelho) {
        return reply.status(403).send({ error: "Modo vermelho ativo. Complete a missão de punição primeiro." });
      }

      const trintaDiasAtras = db.raw("CURRENT_DATE - INTERVAL '30 days'");

      const xpDiario = await db("Quests")
        .select(db.raw("data::date as dia"))
        .sum("xp_recompensa as xp_ganho")
        .where({ user_id: userId, concluida: true })
        .whereRaw("data >= ?", [trintaDiasAtras])
        .groupByRaw("data::date")
        .orderByRaw("data::date")
        .unionAll([
          db("QuestHistory")
            .select(db.raw("data::date as dia"))
            .sum("xp_recompensa as xp_ganho")
            .where({ user_id: userId, concluida: true })
            .whereRaw("data >= ?", [trintaDiasAtras])
            .groupByRaw("data::date"),
          db("DungeonSessions")
            .select(db.raw("criada_em::date as dia"))
            .sum("xp_ganho as xp_ganho")
            .where({ user_id: userId, concluida: true })
            .whereRaw("criada_em::date >= ?", [trintaDiasAtras])
            .groupByRaw("criada_em::date"),
        ]);

      const missoesDiario = await db("Quests")
        .select(db.raw("data::date as dia"))
        .count("* as quantidade")
        .where({ user_id: userId, concluida: true })
        .whereRaw("data >= ?", [trintaDiasAtras])
        .groupByRaw("data::date")
        .orderByRaw("data::date")
        .unionAll([
          db("QuestHistory")
            .select(db.raw("data::date as dia"))
            .count("* as quantidade")
            .where({ user_id: userId, concluida: true })
            .whereRaw("data >= ?", [trintaDiasAtras])
            .groupByRaw("data::date"),
        ]);

      const atributos = await db("User_Attributes")
        .select("str", "agi", "int", "vit", "level", "xp_total")
        .where({ user_id: userId })
        .first();

      return {
        xp_diario: xpDiario.reduce((acc: any, row: any) => {
          const existente = acc.find((r: any) => r.dia === row.dia);
          if (existente) existente.xp_ganho += Number(row.xp_ganho);
          else acc.push({ dia: row.dia, xp_ganho: Number(row.xp_ganho) });
          return acc;
        }, [] as any[]).sort((a: any, b: any) => a.dia.localeCompare(b.dia)),
        missoes_diario: missoesDiario.reduce((acc: any, row: any) => {
          const existente = acc.find((r: any) => r.dia === row.dia);
          if (existente) existente.quantidade += Number(row.quantidade);
          else acc.push({ dia: row.dia, quantidade: Number(row.quantidade) });
          return acc;
        }, [] as any[]).sort((a: any, b: any) => a.dia.localeCompare(b.dia)),
        atributos: {
          str: atributos?.str ?? 5,
          agi: atributos?.agi ?? 5,
          int: atributos?.int ?? 5,
          vit: atributos?.vit ?? 5,
          level: atributos?.level ?? 1,
          xp_total: atributos?.xp_total ?? 0,
        },
      };
    }
  );

  app.patch<{ Body: MetaXpBody }>(
    "/users/meta-xp",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { meta_xp_diaria } = request.body;

      const valor = Number(meta_xp_diaria);
      if (!Number.isInteger(valor) || valor < 100) {
        return reply.status(400).send({ error: "Meta diária de XP deve ser um número inteiro mínimo de 100." });
      }

      await db("Users").where({ id: userId }).update({ meta_xp_diaria: valor });

      return { meta_xp_diaria: valor };
    }
  );
}
