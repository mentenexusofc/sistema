import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface Atributos {
  str: number;
  agi: number;
  int: number;
  vit: number;
  pontos_atributo: number;
}

export default function DistribuirAtributos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [base, setBase] = useState<Atributos | null>(null);
  const [alloc, setAlloc] = useState({ str: 0, agi: 0, int: 0, vit: 0 });

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      const u = res.data.user;
      setBase({ str: u.str, agi: u.agi, int: u.int, vit: u.vit, pontos_atributo: u.pontos_atributo });
    }).catch(() => {
      alert("Não foi possível carregar seus atributos.");
    }).finally(() => setLoading(false));
  }, []);

  const used = alloc.str + alloc.agi + alloc.int + alloc.vit;
  const available = base?.pontos_atributo ?? 0;

  function change(attr: "str" | "agi" | "int" | "vit", delta: number) {
    setAlloc((prev) => {
      const next = prev[attr] + delta;
      if (next < 0) return prev;
      const newTotal = used + delta;
      if (newTotal > available) return prev;
      return { ...prev, [attr]: next };
    });
  }

  async function handleConfirm() {
    if (used === 0) return;
    setSaving(true);
    try {
      await api.post("/atributos/distribuir", alloc);
      alert("Atributos distribuídos!");
      navigate("/status");
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao distribuir pontos");
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="container page page-with-nav">
      <h1 className="title">DISTRIBUIR ATRIBUTOS</h1>

      <p className="points-text">
        Pontos disponíveis: <span className="points-value">{available}</span>
      </p>
      <p className="used-text">Pontos a distribuir: {used}</p>

      <div className="attr-container">
        {([
          { key: "str" as const, label: "STR", color: "var(--red)" },
          { key: "agi" as const, label: "AGI", color: "var(--green)" },
          { key: "int" as const, label: "INT", color: "var(--blue)" },
          { key: "vit" as const, label: "VIT", color: "var(--orange)" },
        ]).map(({ key, label, color }) => (
          <div key={key} className="attr-row">
            <span className="attr-label" style={{ color }}>{label}</span>
            <span className="attr-value">{base![key] + alloc[key]}</span>
            <div className="attr-controls">
              <button className="attr-btn" onClick={() => change(key, -1)}>−</button>
              <span className="attr-alloc">+{alloc[key]}</span>
              <button className="attr-btn" onClick={() => change(key, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-cyan btn-block"
        disabled={used === 0 || saving}
        onClick={handleConfirm}
      >
        {saving ? "SALVANDO..." : "CONFIRMAR"}
      </button>

      <button
        className="btn btn-surface btn-block"
        style={{ marginTop: 12 }}
        onClick={() => navigate("/status")}
      >
        CANCELAR
      </button>
    </div>
  );
}
