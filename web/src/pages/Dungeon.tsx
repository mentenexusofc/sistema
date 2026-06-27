import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const DURACOES = [15, 25, 30, 45, 60];

export default function Dungeon() {
  const navigate = useNavigate();
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [duracao, setDuracao] = useState(25);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [terminaEm, setTerminaEm] = useState<string | null>(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [resultado, setResultado] = useState<{ xp_recebido: number; tempo_cumprido_min: number } | null>(null);
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      setAssinatura(res.data.user.assinatura);
    }).catch(() => {
      setAssinatura(null);
    }).finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (ativo && terminaEm && !pausado) {
      timerRef.current = setInterval(() => {
        const diff = new Date(terminaEm).getTime() - Date.now();
        if (diff <= 0) {
          setTempoRestante(0);
          if (timerRef.current) clearInterval(timerRef.current);
          finalizarSessao(true);
        } else {
          setTempoRestante(Math.ceil(diff / 1000));
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [ativo, terminaEm, pausado]);

  const iniciar = async () => {
    try {
      const res = await api.post("/dungeons/iniciar", { duracao_minutos: duracao });
      const { session, termina_em } = res.data;
      setSessionId(session.id);
      setTerminaEm(termina_em);
      const diff = Math.ceil((new Date(termina_em).getTime() - Date.now()) / 1000);
      setTempoRestante(Math.max(0, diff));
      setAtivo(true);
      setPausado(false);
      setResultado(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao iniciar masmorra.");
    }
  };

  const finalizarSessao = async (automatico = false) => {
    if (!sessionId) return;
    setFinalizando(true);
    try {
      const res = await api.post("/dungeons/finalizar", { session_id: sessionId });
      setResultado(res.data);
      setAtivo(false);
      setSessionId(null);
      setTerminaEm(null);
      setPausado(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      carregarSessoes();
    } catch (err: any) {
      if (!automatico) alert(err?.response?.data?.error || "Erro ao finalizar masmorra.");
    } finally {
      setFinalizando(false);
    }
  };

  const carregarSessoes = async () => {
    try {
      const res = await api.get("/dungeons/sessoes");
      setSessoes(res.data.sessoes);
      setShowHistorico(true);
    } catch {}
  };

  const formatTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
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
          <p className="locked-title">Masmorras Instantâneas</p>
          <p className="locked-desc">
            Apenas caçadores rank S-Rank podem adentrar as masmorras instantâneas.
          </p>
        </div>

        <div className="card" style={{ background: "#1a0a2e", border: "1px solid #3a1a4e", marginTop: 24 }}>
          <p style={{ color: "var(--text3)", fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 12 }}>
            Ao assinar S-Rank você ganha:
          </p>
          {["Timer Pomodoro com recompensa em XP", "Sistema de Clãs", "Exército de Sombras", "Gráficos de Evolução", "Suporte Prioritário"].map((text) => (
            <div key={text} className="benefit-row">
              <span className="benefit-bullet">✦</span>
              <span className="benefit-text">{text}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-gold btn-block" onClick={() => navigate("/upgrade")}>
          DESPERTAR PODER
        </button>
      </div>
    );
  }

  const progresso = duracao * 60 > 0 ? 1 - tempoRestante / (duracao * 60) : 0;

  return (
    <div className="container page page-with-nav">
      <h1 className="title" style={{ color: "var(--red)" }}>MASMORRA</h1>
      <p className="subtitle" style={{ color: "#ff6666" }}>Instantânea</p>

      {!resultado && !ativo && (
        <>
          <div className="timer-circle">
            <p className="timer-display">{formatTempo(duracao * 60)}</p>
          </div>

          <p style={{ color: "var(--text2)", fontSize: 13, fontWeight: "bold", letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>
            Duração
          </p>
          <div className="duracao-row">
            {DURACOES.map((d) => (
              <button
                key={d}
                className={`duracao-btn${duracao === d ? " active" : ""}`}
                onClick={() => setDuracao(d)}
              >
                {d}min
              </button>
            ))}
          </div>

          <button className="btn btn-red btn-block" onClick={iniciar}>
            INICIAR MASMORRA
          </button>

          <button className="btn btn-surface btn-block" style={{ marginTop: 16, background: "none" }} onClick={carregarSessoes}>
            Ver Histórico
          </button>
        </>
      )}

      {ativo && (
        <>
          <div className="timer-circle">
            <p className="timer-display">{formatTempo(tempoRestante)}</p>
            <div className="bar-bg" style={{ width: 160, height: 6, marginTop: 12 }}>
              <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, progresso * 100))}%`, background: "var(--red)" }} />
            </div>
          </div>

          <div className="row gap-12 w-full">
            <button className="btn btn-surface" style={{ flex: 1 }} onClick={() => setPausado(!pausado)}>
              {pausado ? "RETOMAR" : "PAUSAR"}
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => finalizarSessao()} disabled={finalizando}>
              {finalizando ? "FINALIZANDO..." : "FINALIZAR"}
            </button>
          </div>
        </>
      )}

      {resultado && (
        <div className="card" style={{ borderColor: "var(--gold)", textAlign: "center" }}>
          <p style={{ color: "var(--gold)", fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>Masmorra Concluída!</p>
          <p style={{ color: "#00ff88", fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>+{resultado.xp_recebido} XP</p>
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 16 }}>Tempo: {resultado.tempo_cumprido_min} min</p>
          <button className="btn btn-red btn-block" onClick={() => setResultado(null)}>
            NOVA MASMORRA
          </button>
        </div>
      )}

      {showHistorico && sessoes.length > 0 && (
        <div style={{ width: "100%", marginTop: 24 }}>
          <p className="section-title">Últimas Sessões</p>
          {sessoes.slice(0, 5).map((s: any) => (
            <div key={s.id} className="quest-card" style={{ borderLeftColor: s.concluida ? "#00ff88" : "var(--text2)" }}>
              <div className="space-between">
                <span style={{ color: "var(--text3)", fontSize: 13 }}>
                  {s.duracao_minutos}min — {s.concluida ? `${s.xp_ganho} XP` : "Incompleta"}
                </span>
                <span style={{ color: "var(--text2)", fontSize: 12 }}>
                  {new Date(s.criada_em).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
