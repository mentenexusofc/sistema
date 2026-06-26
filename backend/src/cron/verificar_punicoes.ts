import db from "../db/connection";

const PUNICAO_XP = -500;
const EXPIRACAO_HORAS = 24;

let ultimoResetDate: string | null = null;

async function enviarPushNotification(token: string, title: string, body: string) {
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: token, title, body, sound: "default" }),
    });

    if (!res.ok) {
      console.error(`[cron] Push falhou (${res.status}) para token ${token.slice(0, 12)}...`);
    }
  } catch (err) {
    console.error("[cron] Erro ao enviar push:", err);
  }
}

async function arquivarMissoesPassadas() {
  const hoje = new Date().toISOString().slice(0, 10);

  if (ultimoResetDate === hoje) return;

  const arquivadas = await db("QuestHistory").insert(
    db("Quests")
      .whereRaw("data < ?", [hoje])
      .select("user_id", "tipo", "descricao", "xp_recompensa", "concluida", "data")
  );

  if (arquivadas.length > 0) {
    console.log(`[cron] Arquivadas ${arquivadas.length} missões de dias anteriores`);
  }

  await db("Quests")
    .whereRaw("data < ?", [hoje])
    .andWhere("tipo", "!=", "punição")
    .del();

  // Gerar missões a partir de templates ativos
  const templates = await db("QuestTemplates");

  for (const tmpl of templates) {
    const jaExiste = await db("Quests")
      .where({ user_id: tmpl.user_id, descricao: tmpl.descricao, tipo: tmpl.tipo })
      .whereRaw("data = ?", [hoje])
      .first();

    if (!jaExiste) {
      await db("Quests").insert({
        user_id: tmpl.user_id,
        tipo: tmpl.tipo,
        descricao: tmpl.descricao,
        xp_recompensa: tmpl.xp_recompensa,
        data: hoje,
      });
    }
  }

  if (templates.length > 0) {
    console.log(`[cron] ${templates.length} template(s) processados para geração de missões`);
  }

  ultimoResetDate = hoje;
}

export function iniciarCronPunicoes() {
  const verificar = async () => {
    try {
      const agora = new Date();
      const hoje = agora.toISOString().slice(0, 10);

      // 0. Arquivar missões de dias anteriores (uma vez por dia)
      await arquivarMissoesPassadas();

      // 1. Auto-expirar modo_vermelho vencido
      const expirados = await db("Users")
        .where({ modo_vermelho: true })
        .where("penalidade_expira_em", "<=", agora)
        .update({ modo_vermelho: false, penalidade_expira_em: null });

      if (expirados > 0) {
        console.log(`[cron] Modo vermelho expirado para ${expirados} usuário(s)`);
      }

      // 2. Verificar novos usuários para penalizar
      const users = await db("Users").where({ modo_vermelho: false });

      for (const user of users) {
        const pendentes = await db("Quests")
          .where({ user_id: user.id, concluida: false })
          .whereRaw("data < ?", [hoje])
          .first();

        if (!pendentes) continue;

        const punicaoExistente = await db("Quests")
          .where({ user_id: user.id, tipo: "punição", concluida: false })
          .first();

        if (punicaoExistente) continue;

        const expiraEm = new Date(agora.getTime() + EXPIRACAO_HORAS * 60 * 60 * 1000);

        await db.transaction(async (trx) => {
          await trx("Users")
            .where({ id: user.id })
            .update({ modo_vermelho: true, penalidade_expira_em: expiraEm });

          await trx("Quests").insert({
            user_id: user.id,
            tipo: "punição",
            descricao: "Expie suas falhas — complete esta missão de punição.",
            xp_recompensa: PUNICAO_XP,
            data: hoje,
          });
        });

        console.log(`[cron] Modo vermelho ativado para ${user.nome} (${user.email}) até ${expiraEm.toISOString()}`);

        // 3. Notificação push
        if (user.push_token) {
          await enviarPushNotification(
            user.push_token,
            "⚔ Modo Vermelho Ativado",
            "Você tem missões pendentes! Complete a missão de punição para sair do modo vermelho."
          );
        }
      }
    } catch (err) {
      console.error("[cron] Erro ao verificar punições:", err);
    }
  };

  verificar();
  setInterval(verificar, 60 * 1000);
}
