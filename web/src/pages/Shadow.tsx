import { useEffect, useState } from "react";
import api from "../api";

interface Sombra {
  id: string;
  nome: string;
  poder: number;
  nivel: number;
  desbloqueado_em: string;
}

interface ExercitoData {
  sombras: Sombra[];
  almas_sombrias: number;
}

export default function Shadow() {
  const [data, setData] = useState<ExercitoData | null>(null);
  const [userRank, setUserRank] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const meRes = await api.get("/auth/me");
      setUserRank(meRes.data.user.assinatura);
      if (meRes.data.user.assinatura === "s-rank") {
        const shadowRes = await api.get("/shadow/exercito");
        setData(shadowRes.data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function coletarAlmas() {
    setCollecting(true);
    try {
      const res = await api.post("/shadow/coletar", { quantidade: 1 });
      setData((prev) => prev ? { ...prev, almas_sombrias: res.data.souls.quantidade } : prev);
    } catch {
      alert("Não foi possível coletar almas sombrias.");
    } finally {
      setCollecting(false);
    }
  }

  async function evoluirSombra(shadowId: string, nome: string, nivelAtual: number) {
    const custo = nivelAtual * 50;
    if (data && data.almas_sombrias < custo) {
      alert(`Você precisa de ${custo} almas sombrias para evoluir ${nome}.`);
      return;
    }
    try {
      const res = await api.post("/shadow/evoluir", { shadow_id: shadowId });
      const sombraAtualizada = res.data.sombra;
      setData((prev) => prev ? {
        ...prev,
        sombras: prev.sombras.map((s) => s.id === shadowId ? sombraAtualizada : s),
        almas_sombrias: res.data.almas_sombrias_restantes,
      } : prev);
      alert(`${nome} agora é nível ${sombraAtualizada.nivel} com poder ${sombraAtualizada.poder}!`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Falha ao evoluir sombra.");
    }
  }

  if (loading) {
    return (
      <div className="container page-center">
        <div className="loading-container">
          <div className="spinner" style={{ borderTopColor: "var(--purple)" }} />
        </div>
      </div>
    );
  }

  if (userRank !== "s-rank") {
    return (
      <div className="container page page-with-nav">
        <h1 className="title" style={{ color: "var(--purple)" }}>EXÉRCITO DE SOMBRAS</h1>
        <div className="locked-card">
          <p className="locked-icon">🔒</p>
          <p className="locked-title">Apenas S-Rank</p>
          <p className="locked-desc">
            Faça upgrade para o plano S-Rank Premium e desperte seu Exército de Sombras.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page page-with-nav">
      <h1 className="title" style={{ color: "var(--purple)", fontSize: 22 }}>EXÉRCITO DE SOMBRAS</h1>

      <div className="souls-card">
        <p className="souls-icon">💀</p>
        <p className="souls-label">Almas Sombrias</p>
        <p className="souls-count">{data?.almas_sombrias ?? 0}</p>
        <button
          className="btn btn-surface"
          style={{ borderColor: "var(--purple)", background: "#3a1a6e", color: "#cc88ff" }}
          onClick={coletarAlmas}
          disabled={collecting}
        >
          {collecting ? "COLETANDO..." : "COLETAR 1 ALMA"}
        </button>
      </div>

      {data && data.sombras.length === 0 ? (
        <div className="locked-card" style={{ marginTop: 0 }}>
          <p className="empty-text">Nenhuma sombra no exército ainda.</p>
          <p style={{ color: "#4a4a6d", fontSize: 13, textAlign: "center" }}>
            As sombras aparecerão aqui conforme você as desbloquear.
          </p>
        </div>
      ) : (
        data?.sombras.map((sombra) => {
          const custoEvoluir = sombra.nivel * 50;
          return (
            <div key={sombra.id} className="shadow-card">
              <div className="shadow-header">
                <span className="shadow-name">⚫ {sombra.nome}</span>
                <span className="shadow-level">Nv. {sombra.nivel}</span>
              </div>
              <div className="shadow-stats">
                <p className="stat-text">Poder: {sombra.poder}</p>
                <p className="stat-text">Custo próx. evolução: {custoEvoluir} 💀</p>
              </div>
              <button
                className="btn btn-surface btn-block"
                style={{ borderColor: "var(--purple)", background: "#2a0a4e", color: "#cc88ff" }}
                onClick={() => evoluirSombra(sombra.id, sombra.nome, sombra.nivel)}
              >
                EVOLUIR
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
