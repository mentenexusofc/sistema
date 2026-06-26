import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import db from "../db/connection";

interface LoginBody {
  email: string;
  senha: string;
}

export default async function (app: FastifyInstance) {
  app.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const { email, senha } = request.body;

    if (!email || !senha) {
      return reply.status(400).send({ error: "Email e senha são obrigatórios" });
    }

    const user = await db("Users").where({ email: email.trim() }).first();
    if (!user) {
      return reply.status(401).send({ error: "Credenciais inválidas" });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return reply.status(401).send({ error: "Credenciais inválidas" });
    }

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
      rank: user.rank,
    });

    return {
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        rank: user.rank,
        assinatura: user.assinatura,
      },
    };
  });

  app.get(
    "/auth/me",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await db("Users")
        .select(
          "Users.id",
          "Users.nome",
          "Users.email",
          "Users.rank",
          "Users.assinatura",
          "Users.modo_vermelho",
          "Users.penalidade_expira_em",
          "Users.meta_xp_diaria",
          "Users.ultimo_bonus_meta_data",
          "Users.criado_em",
          "User_Attributes.level",
          "User_Attributes.xp_total",
          "User_Attributes.str",
          "User_Attributes.agi",
          "User_Attributes.int",
          "User_Attributes.vit",
          "User_Attributes.pontos_atributo"
        )
        .leftJoin("User_Attributes", "Users.id", "User_Attributes.user_id")
        .where({ "Users.id": (request.user as any).id })
        .first();

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }

      const xpHojeResult = await db("Quests")
        .where({ user_id: user.id, concluida: true })
        .whereRaw("data = CURRENT_DATE")
        .sum("xp_recompensa as total")
        .first();

      const xp_hoje = parseInt(String(xpHojeResult?.total || 0), 10);

      return { user: { ...user, xp_hoje } };
    }
  );
}
