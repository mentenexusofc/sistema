import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Linking,
} from "react-native";
import api from "../services/api";

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

export default function InventarioScreen() {
  const [aba, setAba] = useState<"inventario" | "loja">("inventario");
  const [itens, setItens] = useState<Item[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItens = async () => {
    try {
      const res = await api.get("/itens");
      setItens(res.data.itens);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o inventário.");
    }
  };

  const fetchCatalogo = async () => {
    try {
      const res = await api.get("/itens/catalogo");
      setCatalogo(res.data.catalogo);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a loja.");
    }
  };

  useEffect(() => {
    Promise.all([fetchItens(), fetchCatalogo()]).finally(() => setLoading(false));
  }, []);

  const handleComprar = async (item: CatalogoItem) => {
    if (item.preco_real) {
      try {
        const res = await api.post("/itens/checkout", { item_id: item.id });
        const { url } = res.data;
        if (url) {
          await Linking.openURL(url);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.error || "Erro ao iniciar checkout.";
        Alert.alert("Erro", msg);
      }
      return;
    }

    Alert.alert(
      "Confirmar Compra",
      `Deseja comprar "${item.nome}" por ${item.preco_xp} XP?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Comprar",
          onPress: async () => {
            try {
              await api.post("/itens/comprar", { item_id: item.id });
              Alert.alert("Sucesso", `"${item.nome}" adquirido com sucesso!`);
              fetchItens();
            } catch (err: any) {
              const msg =
                err?.response?.data?.error || "Erro ao comprar item.";
              Alert.alert("Erro", msg);
            }
          },
        },
      ]
    );
  };

  const tipoIcone = (tipo: string) => {
    switch (tipo) {
      case "pocao": return "🧪";
      case "cosmetico": return "✨";
      case "recompensa": return "🎁";
      default: return "📦";
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>INVENTÁRIO</Text>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, aba === "inventario" && styles.tabAtiva]}
          onPress={() => setAba("inventario")}
        >
          <Text
            style={[
              styles.tabText,
              aba === "inventario" && styles.tabTextAtiva,
            ]}
          >
            Meus Itens
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, aba === "loja" && styles.tabAtiva]}
          onPress={() => setAba("loja")}
        >
          <Text
            style={[
              styles.tabText,
              aba === "loja" && styles.tabTextAtiva,
            ]}
          >
            Loja
          </Text>
        </TouchableOpacity>
      </View>

      {aba === "inventario" ? (
        <FlatList
          data={itens}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nenhum item adquirido. Vá até a loja!
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Text style={styles.itemIcone}>{tipoIcone(item.tipo)}</Text>
              <Text style={styles.itemNome}>{item.nome}</Text>
              <Text style={styles.itemTipo}>{item.tipo.toUpperCase()}</Text>
              <Text style={styles.itemDesc}>{item.descricao}</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={catalogo}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum item na loja.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.lojaCard}>
              <View style={styles.lojaHeader}>
                <Text style={styles.lojaIcone}>{tipoIcone(item.tipo)}</Text>
                <View style={styles.lojaInfo}>
                  <Text style={styles.lojaNome}>{item.nome}</Text>
                  <Text style={styles.lojaTipo}>{item.tipo.toUpperCase()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.comprarButton}
                  onPress={() => handleComprar(item)}
                >
                  <Text style={styles.comprarButtonText}>Comprar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.lojaDesc}>{item.descricao}</Text>
              <View style={styles.lojaPrecos}>
                {item.preco_xp > 0 && (
                  <Text style={styles.precoXp}>{item.preco_xp} XP</Text>
                )}
                {item.preco_real && (
                  <Text style={styles.precoReal}>
                    R$ {(item.preco_real / 100).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    padding: 16,
    paddingTop: 60,
  },
  title: {
    color: "#00d4ff",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 3,
    marginBottom: 16,
    textAlign: "center",
  },
  loadingText: {
    color: "#6b6b8d",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabAtiva: {
    backgroundColor: "#00d4ff",
  },
  tabText: {
    color: "#6b6b8d",
    fontSize: 14,
    fontWeight: "bold",
  },
  tabTextAtiva: {
    color: "#0a0a0f",
  },
  grid: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  itemCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: "48%",
    borderLeftWidth: 3,
    borderLeftColor: "#00d4ff",
    alignItems: "center",
  },
  itemIcone: {
    fontSize: 32,
    marginBottom: 8,
  },
  itemNome: {
    color: "#e0e0e0",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  itemTipo: {
    color: "#00d4ff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 4,
  },
  itemDesc: {
    color: "#6b6b8d",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  list: {
    paddingBottom: 20,
  },
  emptyText: {
    color: "#6b6b8d",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  lojaCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#ffd700",
  },
  lojaHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  lojaIcone: {
    fontSize: 28,
    marginRight: 12,
  },
  lojaInfo: {
    flex: 1,
  },
  lojaNome: {
    color: "#e0e0e0",
    fontSize: 15,
    fontWeight: "bold",
  },
  lojaTipo: {
    color: "#ffd700",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 2,
  },
  comprarButton: {
    backgroundColor: "#ffd700",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  comprarButtonText: {
    color: "#0a0a0f",
    fontWeight: "bold",
    fontSize: 13,
  },
  lojaDesc: {
    color: "#6b6b8d",
    fontSize: 13,
    marginTop: 8,
  },
  lojaPrecos: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  precoXp: {
    color: "#ffd700",
    fontSize: 13,
    fontWeight: "bold",
  },
  precoReal: {
    color: "#4caf50",
    fontSize: 13,
    fontWeight: "bold",
  },
});
