import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useCountdown } from "../hooks/useCountdown";

interface User {
  id: string;
  nome: string;
  email: string;
  rank: string;
  assinatura: string;
  modo_vermelho: boolean;
  penalidade_expira_em: string | null;
  criado_em: string;
  level: number;
  xp_total: number;
  str: number;
  agi: number;
  int: number;
  vit: number;
  pontos_atributo: number;
}

export default function Status() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useCountdown(user?.penalidade_expira_em ?? null);

  useEffect(() => {
    setLoading(true);
    api.get("/auth/me").then((res) => {
      setUser(res.data.user);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function xpParaProximoNivel(level: number): number {
    return level * 1000;
  }

  if (loading) {
    return (
      <div className="container page-center">
        <div className="loading-container">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container page-center">
        <p className="error-text">Erro ao carregar dados</p>
      </div>
    );
  }

  const xpNeeded = xpParaProximoNivel(user.level);
  const xpProgress = Math.min(user.xp_total / xpNeeded, 1);

  return (
    <div className="container page page-with-nav">
      <h1 className="title">STATUS</h1>

      {user.modo_vermelho && (
        <div className="red-banner">
          <p className="red-banner-title">⚠ MODO VERMELHO ATIVO</p>
          <p className="red-banner-sub">Complete a missão de punição para sair</p>
          {timer && timer !== "Expirado" && (
            <p className="timer-text">{timer}</p>
          )}
        </div>
      )}

      <div className="card" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--cyan)", fontSize: 18, fontWeight: "bold", letterSpacing: 2, marginBottom: 4 }}>
          {user.rank}
        </p>
        <p style={{ color: "var(--text)", fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
          {user.nome}
        </p>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 16 }}>
          Nível {user.level}
        </p>
        <div style={{ width: "100%" }}>
          <div className="bar-bg">
            <div className="bar-fill" style={{ width: `${xpProgress * 100}%`, backgroundColor: "var(--cyan)" }} />
          </div>
          <p style={{ color: "var(--text2)", fontSize: 12, marginTop: 6 }}>
            {user.xp_total} / {xpNeeded} XP
          </p>
        </div>
      </div>

      <div className="card">
        <p className="section-title">ATRIBUTOS</p>
        {[
          { label: "STR", value: user.str, color: "var(--red)" },
          { label: "AGI", value: user.agi, color: "var(--green)" },
          { label: "INT", value: user.int, color: "var(--blue)" },
          { label: "VIT", value: user.vit, color: "var(--orange)" },
        ].map((attr) => (
          <div key={attr.label} className="row-center" style={{ marginBottom: 12 }}>
            <span style={{ color: attr.color, fontSize: 14, fontWeight: "bold", width: 40 }}>
              {attr.label}
            </span>
            <div className="bar-bg" style={{ flex: 1, height: 10, margin: "0 12px" }}>
              <div className="bar-fill" style={{ width: `${(attr.value / 50) * 100}%`, backgroundColor: attr.color }} />
            </div>
            <span style={{ color: "var(--text)", fontSize: 14, fontWeight: "bold", width: 30, textAlign: "right" }}>
              {attr.value}
            </span>
          </div>
        ))}

        {user.pontos_atributo > 0 && (
          <p style={{ color: "var(--cyan)", fontSize: 14, fontWeight: "bold", textAlign: "center", marginTop: 12, marginBottom: 4 }}>
            Pontos disponíveis: {user.pontos_atributo}
          </p>
        )}

        <button
          className="btn btn-surface btn-block"
          style={{ marginTop: 12, borderColor: "var(--cyan)" }}
          onClick={() => navigate("/distribuir-atributos")}
        >
          {user.pontos_atributo > 0
            ? `DISTRIBUIR (${user.pontos_atributo})`
            : "DISTRIBUIR ATRIBUTOS"}
        </button>
      </div>
    </div>
  );
}
