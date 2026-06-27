import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useCountdown } from "../hooks/useCountdown";

interface User {
  nome: string;
  rank: string;
  modo_vermelho: boolean;
  penalidade_expira_em: string | null;
}

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useCountdown(user?.penalidade_expira_em ?? null);

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      setUser(res.data.user);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container page-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container page-center page-with-nav">
      <h1 className="title">SOLO LEVELING</h1>
      {user && <p className="subtitle">Bem-vindo, {user.nome}</p>}

      {user?.modo_vermelho && (
        <div className="red-banner w-full">
          <p className="red-banner-title">⚠ MODO VERMELHO ATIVO</p>
          <p className="red-banner-sub">Complete a missão de punição para sair</p>
          {timer && timer !== "Expirado" && (
            <p className="timer-text">{timer}</p>
          )}
        </div>
      )}

      <div className="w-full" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button className="btn btn-surface btn-block" style={{ padding: 20 }} onClick={() => navigate("/status")}>
          Status do Hunter
        </button>
        <button className="btn btn-surface btn-block" style={{ padding: 20 }} onClick={() => navigate("/quests")}>
          Missões
        </button>
      </div>
    </div>
  );
}
