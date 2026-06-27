import { useEffect, useState } from "react";
import api from "../api";

interface Item {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  preco_xp: number;
  preco_real: number | null;
  adquirido_em?: string;
}

interface CatalogoItem {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  preco_xp: number;
  preco_real: number | null;
}

function tipoIcone(tipo: string) {
  switch (tipo) {
    case "pocao": return "🧪";
    case "cosmetico": return "✨";
    case "recompensa": return "🎁";
    default: return "📦";
  }
}

export default function Inventario() {
  const [aba, setAba] = useState<"inventario" | "loja">("inventario");
  const [itens, setItens] = useState<Item[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItens = async () => {
    try {
      const res = await api.get("/itens");
      setItens(res.data.itens);
    } catch {
      alert("Não foi possível carregar o inventário.");
    }
  };

  const fetchCatalogo = async () => {
    try {
      const res = await api.get("/itens/catalogo");
      setCatalogo(res.data.catalogo);
    } catch {
      alert("Não foi possível carregar a loja.");
    }
  };

  useEffect(() => {
    Promise.all([fetchItens(), fetchCatalogo()]).finally(() => setLoading(false));
  }, []);

  const handleComprarXP = async (item: CatalogoItem) => {
    if (!confirm(`Deseja comprar "${item.nome}" por ${item.preco_xp} XP?`)) return;
    try {
      await api.post("/itens/comprar", { item_id: item.id });
      alert(`"${item.nome}" adquirido com sucesso!`);
      fetchItens();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao comprar item.");
    }
  };

  const handleComprarReal = async (item: CatalogoItem) => {
    try {
      const res = await api.post("/itens/checkout", { item_id: item.id });
      const { url } = res.data;
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao iniciar checkout.");
    }
  };

  if (loading) {
    return (
      <div className="container page-center">
        <p style={{ color: "var(--text2)" }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container page page-with-nav">
      <h1 className="title">INVENTÁRIO</h1>

      <div className="tabs">
        <button className={`tab${aba === "inventario" ? " active" : ""}`} onClick={() => setAba("inventario")}>
          Meus Itens
        </button>
        <button className={`tab${aba === "loja" ? " active" : ""}`} onClick={() => setAba("loja")}>
          Loja
        </button>
      </div>

      {aba === "inventario" ? (
        itens.length === 0 ? (
          <p className="empty-text">Nenhum item adquirido. Vá até a loja!</p>
        ) : (
          <div className="grid-2">
            {itens.map((item) => (
              <div key={item.id} className="card" style={{ textAlign: "center", marginBottom: 0, padding: 12 }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>{tipoIcone(item.tipo)}</p>
                <p style={{ color: "var(--text)", fontSize: 14, fontWeight: "bold" }}>{item.nome}</p>
                <p style={{ color: "var(--cyan)", fontSize: 10, fontWeight: "bold", letterSpacing: 1, marginTop: 4 }}>
                  {item.tipo.toUpperCase()}
                </p>
                <p style={{ color: "var(--text2)", fontSize: 11, marginTop: 4 }}>{item.descricao}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        catalogo.length === 0 ? (
          <p className="empty-text">Nenhum item na loja.</p>
        ) : (
          catalogo.map((item) => (
            <div key={item.id} className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
              <div className="row-center space-between" style={{ alignItems: "flex-start" }}>
                <div className="row-center">
                  <span style={{ fontSize: 28, marginRight: 12 }}>{tipoIcone(item.tipo)}</span>
                  <div>
                    <p style={{ color: "var(--text)", fontSize: 15, fontWeight: "bold" }}>{item.nome}</p>
                    <p style={{ color: "var(--gold)", fontSize: 10, fontWeight: "bold", letterSpacing: 1, marginTop: 2 }}>
                      {item.tipo.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-gold"
                  style={{ padding: "8px 14px", fontSize: 13 }}
                  onClick={() => item.preco_real ? handleComprarReal(item) : handleComprarXP(item)}
                >
                  Comprar
                </button>
              </div>
              <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 8 }}>{item.descricao}</p>
              <div className="row-center gap-12" style={{ marginTop: 6 }}>
                {item.preco_xp > 0 && (
                  <span style={{ color: "var(--gold)", fontSize: 13, fontWeight: "bold" }}>{item.preco_xp} XP</span>
                )}
                {item.preco_real && (
                  <span style={{ color: "#4caf50", fontSize: 13, fontWeight: "bold" }}>
                    R$ {(item.preco_real / 100).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
}
