import { useEffect, useState } from "react";
import api from "../api";

interface Achievement {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  requisito_tipo: string;
  requisito_valor: number;
  xp_recompensa: number;
  desbloqueado_em: string | null;
}

const iconeMap: Record<string, string> = {
  quest: "📋",
  level: "⭐",
  shadow: "💀",
  dungeon: "🏰",
  clan: "👥",
  xp: "✨",
};

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [novasConquistas, setNovasConquistas] = useState(0);

  useEffect(() => {
    carregarConquistas();
  }, []);

  async function carregarConquistas() {
    try {
      const res = await api.get("/achievements");
      setAchievements(res.data.achievements);
      const novas = res.data.novas_conquistas;
      setNovasConquistas(novas);
      if (novas > 0) {
        alert(`Você desbloqueou ${novas} nova(s) conquista(s) e ganhou XP!`);
      }
    } catch {}
  }

  return (
    <div className="container page page-with-nav">
      <h1 className="title" style={{ color: "var(--gold)" }}>CONQUISTAS</h1>

      {novasConquistas > 0 && (
        <div className="novas-banner">
          <p className="novas-banner-text">
            🎉 {novasConquistas} nova(s) conquista(s) desbloqueada(s)!
          </p>
        </div>
      )}

      {achievements.length === 0 ? (
        <p className="empty-text">Nenhuma conquista disponível.</p>
      ) : (
        achievements.map((item) => {
          const desbloqueada = !!item.desbloqueado_em;
          const icone = iconeMap[item.icone] || "🏆";

          return (
            <div key={item.id} className={`achievement-card${desbloqueada ? " unlocked" : " locked"}`}>
              <div className="achievement-header">
                <span className="achievement-icon">{desbloqueada ? icone : "🔒"}</span>
                <div style={{ flex: 1 }}>
                  <p className={`achievement-name${desbloqueada ? " unlocked" : ""}`}>
                    {desbloqueada ? item.nome : "???"}
                  </p>
                  <p className="achievement-desc">
                    {desbloqueada ? item.descricao : "Conquista não desbloqueada"}
                  </p>
                </div>
              </div>
              {desbloqueada && (
                <div className="achievement-reward">
                  <span className="achievement-reward-text">+{item.xp_recompensa} XP</span>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
