import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Stripe from "stripe";
import db from "../db/connection";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {});

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

export default async function (app: FastifyInstance) {
  app.post<{ Body: { item_id: string } }>(
    "/itens/checkout",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;
      const { item_id } = request.body;

      if (!item_id || typeof item_id !== "string") {
        return reply.status(400).send({ error: "item_id é obrigatório" });
      }

      const item = await db("CatalogoItens").where({ id: item_id }).first();

      if (!item) {
        return reply.status(404).send({ error: "Item não encontrado no catálogo" });
      }

      if (!item.preco_real) {
        return reply.status(400).send({ error: "Este item não possui preço real. Use /itens/comprar com XP." });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        client_reference_id: userId,
        metadata: {
          type: "item",
          item_id: item.id,
          item_name: item.nome,
          item_descricao: item.descricao,
          item_tipo: item.tipo,
          item_preco_xp: String(item.preco_xp),
        },
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: item.nome,
                description: item.descricao,
              },
              unit_amount: item.preco_real,
            },
            quantity: 1,
          },
        ],
        success_url: `${BASE_URL}/stripe/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/stripe/cancelado`,
      });

      return reply.send({ url: session.url });
    }
  );

  app.post(
    "/assinatura/checkout",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;

      const srankPriceId = process.env.STRIPE_SRANK_PRICE_ID;

      if (!srankPriceId) {
        return reply.status(500).send({ error: "Preço da assinatura S-Rank não configurado no servidor." });
      }

      const user = await db("Users").where({ id: userId }).first();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        client_reference_id: userId,
        customer: user.stripe_customer_id || undefined,
        metadata: {
          type: "subscription",
          plan: "s-rank",
        },
        line_items: [
          {
            price: srankPriceId,
            quantity: 1,
          },
        ],
        success_url: `${BASE_URL}/stripe/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/stripe/cancelado`,
      });

      if (session.customer && !user.stripe_customer_id) {
        await db("Users").where({ id: userId }).update({
          stripe_customer_id: session.customer as string,
        });
      }

      return reply.send({ url: session.url });
    }
  );

  app.post(
    "/stripe/webhook",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const sig = request.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const rawBody = (request as any).rawBody;

      if (!webhookSecret || !sig || !rawBody) {
        return reply.status(400).send({ error: "Missing webhook configuration" });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch {
        return reply.status(400).send({ error: "Invalid signature" });
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const metadata = session.metadata || {};

        if (!userId) {
          return reply.status(400).send({ error: "No client_reference_id" });
        }

        if (metadata.type === "item") {
          await db("Itens").insert({
            user_id: userId,
            nome: metadata.item_name,
            tipo: metadata.item_tipo,
            descricao: metadata.item_descricao,
            preco_xp: parseInt(metadata.item_preco_xp || "0"),
            preco_real: session.amount_total || 0,
          });
        } else if (metadata.type === "subscription") {
          await db("Users").where({ id: userId }).update({
            assinatura: "s-rank",
            rank: "S-Rank",
            stripe_customer_id: session.customer as string,
          });
        }
      }

      return reply.send({ received: true });
    }
  );
}
