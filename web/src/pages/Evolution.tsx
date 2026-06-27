import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import api from "../api";

const LABELS_MES: Record<string, string> = {
  STR: "Força",
  AGI: "Agilidade",
  INT: "Inteligência",
  VIT: "Vitalidade",
};

function RadarChart({ data, size = 200 }: { data: { label: string; value: number }[]; size?: number }) {
  const center = size / 2;
  const radius = size * 0.38;
  const levels = 5;
  const maxVal = Math.max(...data.map((d) => d.value), 10);
  const angleStep = (Math.PI * 2) / data.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / maxVal) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const polygonPoints = data.map((d, i) => {
    const p = getPoint(i, d.value);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size}>
        {Array.from({ length: levels }).map((_, level) => {
          const r = ((level + 1) / levels) * radius;
          const pts = data.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(" ");
          return <polygon key={level} points={pts} fill="none" stroke="#2a2a4e" strokeWidth={1} />;
        })}
        {data.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return (
            <line
              key={i}
              x1={center} y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="#2a2a4e" strokeWidth={1}
            />
          );
        })}
        <polygon points={polygonPoints} fill="rgba(0, 212, 255, 0.15)" stroke="#00d4ff" strokeWidth={2} />
        {data.map((d, i) => {
          const p = getPoint(i, d.value);
          return <circle key={i} cx={p.x} cy={p.y} r={4} fill="#00d4ff" />;
        })}
        {data.map((d, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const labelR = radius + 24;
          return (
            <text
              key={i}
              x={center + labelR * Math.cos(angle)}
              y={center + labelR * Math.sin(angle)}
              fill="#a0a0c0" fontSize={11} fontWeight="bold"
              textAnchor="middle" dominantBaseline="middle"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
      <div className="radar-legend">
        {data.map((d, i) => (
          <div key={i} className="radar-legend-item">
            <span className="radar-legend-label">{LABELS_MES[d.label] || d.label}:</span>
            <span className="radar-legend-value">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Evolution() {
  const navigate = useNavigate();
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [xpDiario, setXpDiario] = useState<any[]>([]);
  const [missoesDiario, setMissoesDiario] = useState<any[]>([]);
  const [atributos, setAtributos] = useState<any>(null);
  const [periodo, setPeriodo] = useState<7 | 30>(7);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => { carregarUsuario(); }, []);

  const carregarUsuario = async () => {
    try {
      const res = await api.get("/auth/me");
      setAssinatura(res.data.user.assinatura);
      if (res.data.user.assinatura === "s-rank") carregarEvolucao();
    } catch {
      setAssinatura(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const carregarEvolucao = async () => {
    setLoadingData(true);
    setErro(null);
    try {
      const res = await api.get("/users/evolucao");
      setXpDiario(res.data.xp_diario || []);
      setMissoesDiario(res.data.missoes_diario || []);
      setAtributos(res.data.atributos);
    } catch (err: any) {
      setErro(err?.response?.data?.error || "Erro ao carregar dados de evolução.");
    } finally {
      setLoadingData(false);
    }
  };

  const filtrarPorPeriodo = (dados: any[], dias: number) => {
    if (!dados || dados.length === 0) return [];
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    return dados.filter((d) => new Date(d.dia + "T00:00:00") >= limite);
  };

  const prepararDadosGrafico = (dados: any[], campo: string) => {
    const filtrados = filtrarPorPeriodo(dados, periodo);
    return filtrados.slice(-14).map((d) => {
      const parts = d.dia.split("-");
      return { label: `${parts[2]}/${parts[1]}`, valor: Number(d[campo]) };
    });
  };

  if (loadingUser) {
    return (
      <div className="container page-center">
        <div className="loading-container"><div className="spinner" /></div>
      </div>
    );
  }

  if (assinatura !== "s-rank") {
    return (
      <div className="container page page-with-nav" style={{ paddingBottom: 80 }}>
        <div className="locked-card">
          <p className="locked-icon">📊</p>
          <p className="locked-title">Gráficos de Evolução</p>
          <p className="locked-desc">Apenas caçadores rank S-Rank podem visualizar seus gráficos de evolução.</p>
        </div>
        <div className="card" style={{ background: "#1a0a2e", border: "1px solid #3a1a4e", marginTop: 24 }}>
          <p style={{ color: "var(--text3)", fontWeight: "bold", textAlign: "center", marginBottom: 12 }}>Ao assinar S-Rank você ganha:</p>
          {["Gráfico de XP ganho por dia", "Radar de atributos (STR, AGI, INT, VIT)", "Gráfico de missões completadas", "Masmorras Instantâneas", "Sistema de Clãs e Exército de Sombras"].map((text) => (
            <div key={text} className="benefit-row">
              <span className="benefit-bullet">✦</span>
              <span className="benefit-text">{text}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-gold btn-block" onClick={() => navigate("/upgrade")}>DESPERTAR PODER</button>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="container page-center">
        <p className="error-text">{erro}</p>
        <button className="btn btn-surface" style={{ marginTop: 16 }} onClick={carregarEvolucao}>Tentar novamente</button>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="container page-center">
        <div className="loading-container">
          <div className="spinner" />
          <p style={{ color: "var(--text2)" }}>Carregando dados de evolução...</p>
        </div>
      </div>
    );
  }

  const xpFiltrado = prepararDadosGrafico(xpDiario, "xp_ganho");
  const missoesFiltrado = prepararDadosGrafico(missoesDiario, "quantidade");

  return (
    <div className="container page page-with-nav" style={{ paddingBottom: 80 }}>
      <h1 className="title">EVOLUÇÃO</h1>
      <p className="subtitle" style={{ color: "#4a8cff" }}>Gráficos do Hunter</p>

      <div className="periodo-row">
        <button className={`periodo-btn${periodo === 7 ? " active" : ""}`} onClick={() => setPeriodo(7)}>7 DIAS</button>
        <button className={`periodo-btn${periodo === 30 ? " active" : ""}`} onClick={() => setPeriodo(30)}>30 DIAS</button>
      </div>

      <div className="chart-card">
        <p className="chart-title">⚔ XP por Dia</p>
        {xpFiltrado.length > 0 ? (
          <div className="chart-wrapper">
            <LineChart width={Math.max(300, xpFiltrado.length * 50)} height={200} data={xpFiltrado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4e" />
              <XAxis dataKey="label" stroke="#6b6b8d" fontSize={11} />
              <YAxis stroke="#6b6b8d" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8 }}
                labelStyle={{ color: "#e0e0e0" }}
              />
              <Line type="monotone" dataKey="valor" stroke="#00d4ff" strokeWidth={2} dot={{ r: 4, fill: "#00d4ff" }} />
            </LineChart>
          </div>
        ) : (
          <p className="empty-text">Nenhum XP registrado nos últimos {periodo} dias.</p>
        )}
      </div>

      <div className="chart-card">
        <p className="chart-title">📋 Missões por Dia</p>
        {missoesFiltrado.length > 0 ? (
          <div className="chart-wrapper">
            <BarChart width={Math.max(300, missoesFiltrado.length * 50)} height={200} data={missoesFiltrado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4e" />
              <XAxis dataKey="label" stroke="#6b6b8d" fontSize={11} />
              <YAxis stroke="#6b6b8d" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8 }}
                labelStyle={{ color: "#e0e0e0" }}
              />
              <Bar dataKey="valor" fill="#00d4ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </div>
        ) : (
          <p className="empty-text">Nenhuma missão concluída nos últimos {periodo} dias.</p>
        )}
      </div>

      <div className="chart-card">
        <p className="chart-title">🎯 Atributos</p>
        {atributos ? (
          <RadarChart
            data={[
              { label: "STR", value: atributos.str },
              { label: "AGI", value: atributos.agi },
              { label: "INT", value: atributos.int },
              { label: "VIT", value: atributos.vit },
            ]}
            size={200}
          />
        ) : (
          <p className="empty-text">Nenhum atributo encontrado.</p>
        )}
      </div>
    </div>
  );
}
