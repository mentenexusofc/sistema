import { useState } from "react";
import api from "../api";

export default function Upgrade() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await api.post("/assinatura/checkout");
      const { url } = res.data;
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao iniciar checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page page-with-nav">
      <h1 className="title">UPGRADE</h1>
      <p className="subtitle">Desperte seu poder máximo</p>

      <div className="card" style={{ textAlign: "center", borderColor: "#3a3a5e" }}>
        <p style={{ color: "var(--text2)", fontSize: 11, fontWeight: "bold", letterSpacing: 2 }}>SEU RANK ATUAL</p>
        <p style={{ color: "var(--text2)", fontSize: 36, fontWeight: "bold", marginTop: 8 }}>E-Rank</p>
        <p style={{ color: "#4a4a6e", fontSize: 14, marginTop: 4 }}>Plano Free</p>
      </div>

      <p className="arrow">↓</p>

      <div className="card" style={{ textAlign: "center", background: "#1a0a2e", border: "2px solid var(--gold)" }}>
        <p style={{
          color: "var(--gold)", fontSize: 14, fontWeight: "bold", letterSpacing: 3,
          background: "rgba(255, 215, 0, 0.15)", padding: "4px 16px", borderRadius: 20,
          display: "inline-block", marginBottom: 12
        }}>
          S-Rank
        </p>
        <p style={{ color: "var(--text)", fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>Plano Premium</p>

        <div style={{ width: "100%" }}>
          {[
            "Masmorras Instantâneas (Pomodoro)",
            "Sistema de Clãs",
            "Exército de Sombras",
            "Gráficos de Evolução Detalhados",
            "Suporte Prioritário",
            "Sem limites de missões diárias",
          ].map((text) => (
            <div key={text} className="benefit-row">
              <span className="benefit-bullet">✦</span>
              <span className="benefit-text">{text}</span>
            </div>
          ))}
        </div>

        <button
          className="btn btn-gold btn-block"
          style={{ marginTop: 24 }}
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? "Abrindo checkout..." : "ASSINAR S-RANK"}
        </button>
        <p style={{ color: "var(--text2)", fontSize: 12, marginTop: 8 }}>Cancelamento a qualquer momento</p>
      </div>
    </div>
  );
}
