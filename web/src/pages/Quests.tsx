import { useEffect, useMemo, useState } from "react";
import api from "../api";

interface Quest {
  id: string;
  tipo: string;
  descricao: string;
  xp_recompensa: number;
  concluida: boolean;
  data: string;
}

interface QuestSection {
  title: string;
  data: Quest[];
}

interface QuestTemplate {
  id: string;
  tipo: string;
  descricao: string;
  xp_recompensa: number;
  frequencia: string;
  criado_em: string;
}

function formatarData(dataStr: string) {
  const [ano, mes, dia] = dataStr.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  if (data.toDateString() === hoje.toDateString()) return "Hoje";
  if (data.toDateString() === ontem.toDateString()) return "Ontem";
  return `${dia}/${mes}/${ano}`;
}

function agruparPorData(quests: Quest[]): QuestSection[] {
  const map = new Map<string, Quest[]>();
  for (const q of quests) {
    const key = q.data;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([title, data]) => ({ title, data }));
}

function hojeStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Quests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [xp, setXp] = useState("");
  const [modoVermelho, setModoVermelho] = useState(false);
  const [metaXpDiaria, setMetaXpDiaria] = useState(1000);
  const [xpHoje, setXpHoje] = useState(0);
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [metaInput, setMetaInput] = useState("");

  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateTipo, setTemplateTipo] = useState("");
  const [templateDescricao, setTemplateDescricao] = useState("");
  const [templateXp, setTemplateXp] = useState("");
  const [templateFreq, setTemplateFreq] = useState("diaria");

  const sections = useMemo(() => agruparPorData(quests), [quests]);
  const hoje = hojeStr();

  const progressoHoje = useMemo(() => {
    const hojeQuests = quests.filter((q) => q.data === hoje);
    const total = hojeQuests.length;
    const concluidas = hojeQuests.filter((q) => q.concluida).length;
    return { total, concluidas };
  }, [quests, hoje]);

  const fetchQuests = async () => {
    try {
      const res = await api.get("/quests");
      setQuests(res.data.quests);
    } catch {
      alert("Não foi possível carregar as missões.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatus = async () => {
    try {
      const res = await api.get("/auth/me");
      setModoVermelho(res.data.user.modo_vermelho);
      setMetaXpDiaria(res.data.user.meta_xp_diaria ?? 1000);
      setXpHoje(res.data.user.xp_hoje ?? 0);
    } catch {}
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/quests/templates");
      setTemplates(res.data.templates);
    } catch {}
  };

  useEffect(() => {
    fetchQuests();
    fetchUserStatus();
    fetchTemplates();
  }, []);

  const handleToggleComplete = async (id: string) => {
    try {
      await api.patch(`/quests/${id}`);
      fetchQuests();
      fetchUserStatus();
    } catch {
      alert("Não foi possível atualizar a missão.");
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta missão?")) return;
    api.delete(`/quests/${id}`).then(() => {
      fetchQuests();
    }).catch(() => {
      alert("Não foi possível excluir a missão.");
    });
  };

  const handleCreate = async () => {
    if (!tipo.trim() || !descricao.trim()) {
      alert("Preencha tipo e descrição da missão.");
      return;
    }
    try {
      await api.post("/quests", {
        tipo: tipo.trim(),
        descricao: descricao.trim(),
        xp_recompensa: xp ? Number(xp) : 0,
      });
      setShowForm(false);
      setTipo("");
      setDescricao("");
      setXp("");
      fetchQuests();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Não foi possível criar a missão.");
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateTipo.trim() || !templateDescricao.trim()) {
      alert("Preencha tipo e descrição do template.");
      return;
    }
    try {
      await api.post("/quests/templates", {
        tipo: templateTipo.trim(),
        descricao: templateDescricao.trim(),
        xp_recompensa: templateXp ? Number(templateXp) : 0,
        frequencia: templateFreq,
      });
      setTemplateTipo("");
      setTemplateDescricao("");
      setTemplateXp("");
      setTemplateFreq("diaria");
      fetchTemplates();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Não foi possível criar o template.");
    }
  };

  const handleUpdateMeta = async () => {
    const valor = Number(metaInput);
    if (!Number.isInteger(valor) || valor < 100) {
      alert("A meta deve ser um número inteiro mínimo de 100.");
      return;
    }
    try {
      await api.patch("/users/meta-xp", { meta_xp_diaria: valor });
      setMetaXpDiaria(valor);
      setShowMetaForm(false);
      setMetaInput("");
    } catch {
      alert("Não foi possível atualizar a meta.");
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (!confirm("Tem certeza?")) return;
    api.delete(`/quests/templates/${id}`).then(() => {
      fetchTemplates();
    }).catch(() => {
      alert("Não foi possível excluir o template.");
    });
  };

  if (loading) {
    return (
      <div className="container page-center">
        <p style={{ color: "var(--text2)" }}>Carregando missões...</p>
      </div>
    );
  }

  return (
    <div className="container page page-with-nav">
      <h1 className="title">QUEST LOG</h1>

      {progressoHoje.total > 0 && (
        <div className="progress-container">
          <p className="progress-text">
            Progresso Diário: {progressoHoje.concluidas}/{progressoHoje.total} missões
          </p>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${(progressoHoje.concluidas / progressoHoje.total) * 100}%`, background: "var(--cyan)" }} />
          </div>
        </div>
      )}

      <div className="progress-container">
        <div className="space-between mb-8">
          <p className="progress-text" style={{ marginBottom: 0 }}>
            Meta XP: {xpHoje}/{metaXpDiaria} XP
          </p>
          <button className="btn btn-surface" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => { setMetaInput(String(metaXpDiaria)); setShowMetaForm(true); }}>
            Editar
          </button>
        </div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill xp${xpHoje >= metaXpDiaria ? " complete" : ""}`}
            style={{ width: `${Math.min((xpHoje / metaXpDiaria) * 100, 100)}%` }}
          />
        </div>
        {xpHoje >= metaXpDiaria && (
          <p className="bonus-text">Bônus de XP já concedido hoje!</p>
        )}
      </div>

      {showMetaForm && (
        <div className="form-box">
          <input
            className="input"
            placeholder="Nova meta de XP diária"
            value={metaInput}
            onChange={(e) => setMetaInput(e.target.value)}
            type="number"
          />
          <div className="form-buttons">
            <button className="btn btn-cyan" onClick={handleUpdateMeta}>Salvar Meta</button>
            <button className="btn btn-surface" onClick={() => setShowMetaForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {modoVermelho && (
        <div className="red-banner">
          <p className="red-banner-title">⚠ MODO VERMELHO</p>
          <p className="red-banner-sub">Complete a missão de punição para criar novas missões</p>
        </div>
      )}

      <button
        className="btn btn-surface"
        style={{ marginBottom: 8, padding: "6px 12px", fontSize: 13, background: "none" }}
        onClick={() => setShowTemplates(!showTemplates)}
      >
        {showTemplates ? "▲" : "▼"} Templates ({templates.length})
      </button>

      {showTemplates && (
        <div className="templates-section">
          <p className="section-title" style={{ color: "var(--cyan)" }}>Meus Templates</p>

          <div className="template-form">
            <input className="input" placeholder="Tipo" value={templateTipo} onChange={(e) => setTemplateTipo(e.target.value)} />
            <textarea className="input" placeholder="Descrição" value={templateDescricao} onChange={(e) => setTemplateDescricao(e.target.value)} />
            <input className="input" placeholder="XP" type="number" value={templateXp} onChange={(e) => setTemplateXp(e.target.value)} />
            <div className="freq-selector">
              <button className={`freq-option${templateFreq === "diaria" ? " active" : ""}`} onClick={() => setTemplateFreq("diaria")}>Diária</button>
              <button className={`freq-option${templateFreq === "semanal" ? " active" : ""}`} onClick={() => setTemplateFreq("semanal")}>Semanal</button>
            </div>
            <button className="btn btn-cyan btn-block" onClick={handleCreateTemplate}>Adicionar Template</button>
          </div>

          {templates.map((tmpl) => (
            <div key={tmpl.id} className="template-card">
              <div className="template-info">
                <p className="template-tipo">{tmpl.tipo.toUpperCase()}</p>
                <p className="template-desc">{tmpl.descricao}</p>
                <p className="template-meta">{tmpl.xp_recompensa} XP · {tmpl.frequencia === "diaria" ? "Diária" : "Semanal"}</p>
              </div>
              <button className="template-delete" onClick={() => handleDeleteTemplate(tmpl.id)}>✕</button>
            </div>
          ))}

          {templates.length === 0 && <p className="empty-text">Nenhum template ainda. Crie um acima!</p>}
        </div>
      )}

      {showForm ? (
        <div className="form-box">
          <input className="input" placeholder="Tipo (ex: diaria, semanal)" value={tipo} onChange={(e) => setTipo(e.target.value)} />
          <textarea className="input" placeholder="Descrição da missão" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <input className="input" placeholder="XP de recompensa" type="number" value={xp} onChange={(e) => setXp(e.target.value)} />
          <div className="form-buttons">
            <button className="btn btn-cyan" onClick={handleCreate}>Criar Missão</button>
            <button className="btn btn-surface" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      ) : !modoVermelho ? (
        <button className="btn btn-surface btn-block" style={{ borderColor: "var(--cyan)", marginBottom: 16 }} onClick={() => setShowForm(true)}>
          + Nova Missão
        </button>
      ) : null}

      {sections.length === 0 ? (
        <p className="empty-text">Nenhuma missão ainda. Crie sua primeira!</p>
      ) : (
        sections.map((section) => (
          <div key={section.title}>
            <p className="section-header">{formatarData(section.title)}</p>
            {section.data.map((quest) => (
              <div
                key={quest.id}
                className={`quest-card${quest.concluida ? " done" : ""}${quest.tipo === "punição" && !quest.concluida ? " punicao" : ""}`}
              >
                <div className="quest-header">
                  <span className="quest-tipo">{quest.tipo.toUpperCase()}</span>
                  <span className={`quest-xp${quest.xp_recompensa < 0 ? " negativo" : ""}`}>
                    {quest.xp_recompensa >= 0 ? "+" : ""}{quest.xp_recompensa} XP
                  </span>
                </div>
                <p className="quest-desc">{quest.descricao}</p>
                <div className="quest-actions">
                  <button
                    className={`btn-action ${quest.concluida ? "undo" : "check"}`}
                    onClick={() => handleToggleComplete(quest.id)}
                  >
                    {quest.concluida ? "↩" : "✓"}
                  </button>
                  <button className="btn-action delete" onClick={() => handleDelete(quest.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
