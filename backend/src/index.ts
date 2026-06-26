import Fastify from "fastify";
import { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import db from "./db/connection";
import { runMigrations } from "./db/connection";
import usersRouter from "./routes/users";
import authRouter from "./routes/auth";
import questsRouter from "./routes/quests";
import itensRouter from "./routes/itens";
import stripeRouter from "./routes/stripe";
import dungeonsRouter from "./routes/dungeons";
import clansRouter from "./routes/clans";
import shadowRouter from "./routes/shadow";
import achievementsRouter from "./routes/achievements";
import notificationsRouter from "./routes/notifications";
import atributosRouter from "./routes/atributos";
import { iniciarCronPunicoes } from "./cron/verificar_punicoes";

const server = Fastify({ logger: true });

server.register(cors, { origin: "*" });

server.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (req: any, body: string, done: (err: Error | null, body?: any) => void) => {
    try {
      req.rawBody = body;
      done(null, JSON.parse(body));
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);

server.register(jwt, {
  secret: process.env.JWT_SECRET || "dev-secret-solo-leveling",
});

server.decorate(
  "authenticate",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Não autorizado" });
    }
  }
);

server.get("/health", async () => {
  try {
    await db.raw("SELECT 1");
    return { status: "ok", rank: "S-Rank", db: "connected" };
  } catch {
    return { status: "error", rank: "S-Rank", db: "disconnected" };
  }
});

server.register(usersRouter);
server.register(authRouter);
server.register(questsRouter);
server.register(itensRouter);
server.register(stripeRouter);
server.register(dungeonsRouter);
server.register(clansRouter);
server.register(shadowRouter);
server.register(achievementsRouter);
server.register(notificationsRouter);
server.register(atributosRouter);

iniciarCronPunicoes();

const start = async () => {
  try {
    await runMigrations();
    await server.listen({ port: 3001, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
