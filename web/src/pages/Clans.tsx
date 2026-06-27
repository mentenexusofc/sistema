import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="benefit-row">
      <span className="benefit-bullet">✦</span>
      <span className="benefit-text">{text}</span>
    </div>
  );
}

export default function Clans() {
  const navigate = useNavigate();
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [clans, setClans] = useState<any[]>([]);
  const [meuClan, setMeuClan] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [descricaoNova, setDescricaoNova] = useState("");
  const [tab, setTab] = useState<"lista" | "meu">("lista");

  useEffect(() => {
    carregarUsuario();
  }, []);

  const carregarUsuario = async () => {
    try {
      const res = await api.get("/auth/me");
      setAssinatura(res.data.user.assinatura);
      if (res.data.user.assinatura === "s-rank") carregarClans();
    } catch {
      setAssinatura(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const carregarClans = async () => {
    try {
      const res = await api.get("/clans");
      setClans(res.data.clans);
    } catch {}
  };

  const entrarClan = async (clanId: string) => {
    try {
      await api.post(`/clans/${clanId}/entrar`);
      alert("Você entrou no clã!");
      carregarClans();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao entrar no clã.");
    }
  };

  const criarClan = async () => {
    if (!nomeNovo.trim()) {
      alert("Digite um nome para o clã.");
      return;
    }
    try {
      await api.post("/clans", { nome: nomeNovo.trim(), descricao: descricaoNova.trim() });
      alert("Clã criado!");
      setShowCreate(false);
      setNomeNovo("");
      setDescricaoNova("");
      carregarClans();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao criar clã.");
    }
  };

  const verDetalhes = async (clanId: string) => {
    try {
      const res = await api.get(`/clans/${clanId}`);
      setMeuClan(res.data.clan);
      setMembers(res.data.membros);
      setTab("meu");
    } catch {}
  };

  if (loadingUser) {
    return (
      <div className="container page-center">
        <p style={{ color: "var(--text2)" }}>Carregando...</p>
      </div>
    );
  }

  if (assinatura !== "s-rank") {
    return (
      <div className="container page page-with-nav">
        <div className="locked-card">
          <p className="locked-icon">🔒</p>
          <p className="locked-title">Sistema de Clãs</p>
          <p className="locked-desc">Apenas caçadores rank S-Rank podem formar ou entrar em clãs.</p>
        </div>

        <div className="card" style={{ background: "#1a0a2e", border: "1px solid #3a1a4e", marginTop: 24 }}>
          <p style={{ color: "var(--text3)", fontWeight: "bold", textAlign: "center", marginBottom: 12 }}>
            Ao assinar S-Rank você ganha:
          </p>
          <BenefitItem text="Timer Pomodoro com recompensa em XP" />
          <BenefitItem text="Sistema de Clãs" />
          <BenefitItem text="Exército de Sombras" />
          <BenefitItem text="Gráficos de Evolução" />
          <BenefitItem text="Suporte Prioritário" />
        </div>

        <button className="btn btn-gold btn-block" onClick={() => navigate("/upgrade")}>
          DESPERTAR PODER
        </button>
      </div>
    );
  }

  if (tab === "meu" && meuClan) {
    return (
      <div className="container page page-with-nav">
        <button className="btn btn-surface" style={{ background: "none", padding: 0, marginBottom: 12 }} onClick={() => { setMeuClan(null); setTab("lista"); }}>
          ← Voltar
        </button>
        <p style={{ color: "var(--gold)", fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>
          {meuClan.nome}
        </p>
        <p style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", marginBottom: 8 }}>
          {meuClan.descricao || "Sem descrição"}
        </p>
        <p style={{ color: "var(--text2)", fontSize: 12, textAlign: "center", marginBottom: 24 }}>
          Rank Médio: {meuClan.rank_medio}
        </p>
        <p className="section-title">Membros ({members.length})</p>
        {members.map((m) => (
          <div key={m.id} className="member-card">
            <div>
              <p className="member-name">{m.nome}</p>
              <p className="member-level">Level {m.level} • {m.rank}</p>
            </div>
            <span className={`member-cargo${m.cargo === "lider" ? " lider" : ""}`}>
              {m.cargo.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container page page-with-nav">
      <h1 className="title" style={{ color: "var(--gold)" }}>CLÃS</h1>
      <p className="subtitle" style={{ color: "#ffaa00" }}>Irmandade S-Rank</p>

      <button
        className="btn btn-surface btn-block"
        style={{ borderColor: "var(--gold)", marginBottom: 16 }}
        onClick={() => setShowCreate(!showCreate)}
      >
        {showCreate ? "CANCELAR" : "+ CRIAR CLÃ"}
      </button>

      {showCreate && (
        <div className="card" style={{ padding: 16 }}>
          <input className="input" placeholder="Nome do clã" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} />
          <textarea className="input" placeholder="Descrição (opcional)" value={descricaoNova} onChange={(e) => setDescricaoNova(e.target.value)} />
          <button className="btn btn-gold btn-block" onClick={criarClan}>CRIAR</button>
        </div>
      )}

      <p className="section-title">Clãs Disponíveis</p>
      {clans.length === 0 && <p className="empty-text">Nenhum clã cadastrado ainda.</p>}
      {clans.map((c) => (
        <div key={c.id} className="clan-card" onClick={() => verDetalhes(c.id)}>
          <div className="clan-info">
            <p className="clan-name">{c.nome}</p>
            <p className="clan-detail">Rank {c.rank_medio} • {c.total_membros} membro(s)</p>
          </div>
          <button
            className="btn btn-surface"
            style={{ padding: "8px 16px", fontSize: 12 }}
            onClick={(e) => { e.stopPropagation(); entrarClan(c.id); }}
          >
            ENTRAR
          </button>
        </div>
      ))}
    </div>
  );
}
