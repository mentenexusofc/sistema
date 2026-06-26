import { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

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

export default function ShadowScreen() {
  const [data, setData] = useState<ExercitoData | null>(null);
  const [userRank, setUserRank] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    setLoading(true);
    try {
      const meRes = await api.get("/auth/me");
      setUserRank(meRes.data.user.assinatura);

      if (meRes.data.user.assinatura === "s-rank") {
        const shadowRes = await api.get("/shadow/exercito");
        setData(shadowRes.data);
      }
    } catch {
      // erro silencioso
    } finally {
      setLoading(false);
    }
  }

  async function coletarAlmas() {
    setCollecting(true);
    try {
      const res = await api.post("/shadow/coletar", { quantidade: 1 });
      setData((prev) => prev ? { ...prev, almas_sombrias: res.data.souls.quantidade } : prev);
    } catch {
      Alert.alert("Erro", "Não foi possível coletar almas sombrias.");
    } finally {
      setCollecting(false);
    }
  }

  async function evoluirSombra(shadowId: string, nome: string, nivelAtual: number) {
    const custo = nivelAtual * 50;
    if (data && data.almas_sombrias < custo) {
      Alert.alert("Almas insuficientes", `Você precisa de ${custo} almas sombrias para evoluir ${nome}.`);
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
      Alert.alert("Evolução concluída!", `${nome} agora é nível ${sombraAtualizada.nivel} com poder ${sombraAtualizada.poder}!`);
    } catch (err: any) {
      Alert.alert("Erro", err.response?.data?.error || "Falha ao evoluir sombra.");
    }
  }

  function renderSombra({ item }: { item: Sombra }) {
    const custoEvoluir = item.nivel * 50;
    return (
      <View style={styles.shadowCard}>
        <View style={styles.shadowHeader}>
          <Text style={styles.shadowName}>⚫ {item.nome}</Text>
          <Text style={styles.shadowLevel}>Nv. {item.nivel}</Text>
        </View>
        <View style={styles.shadowStats}>
          <Text style={styles.statText}>Poder: {item.poder}</Text>
          <Text style={styles.statText}>Custo próx. evolução: {custoEvoluir} 💀</Text>
        </View>
        <TouchableOpacity style={styles.evolveButton} onPress={() => evoluirSombra(item.id, item.nome, item.nivel)}>
          <Text style={styles.evolveButtonText}>EVOLUIR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#aa44ff" />
      </View>
    );
  }

  if (userRank !== "s-rank") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EXÉRCITO DE SOMBRAS</Text>
        <View style={styles.lockedCard}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>Apenas S-Rank</Text>
          <Text style={styles.lockedText}>
            Faça upgrade para o plano S-Rank Premium e desperte seu Exército de Sombras.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EXÉRCITO DE SOMBRAS</Text>

      <View style={styles.soulsCard}>
        <Text style={styles.soulsIcon}>💀</Text>
        <Text style={styles.soulsLabel}>Almas Sombrias</Text>
        <Text style={styles.soulsCount}>{data?.almas_sombrias ?? 0}</Text>
        <TouchableOpacity
          style={[styles.collectButton, collecting && styles.collectButtonDisabled]}
          onPress={coletarAlmas}
          disabled={collecting}
        >
          <Text style={styles.collectButtonText}>{collecting ? "COLETANDO..." : "COLETAR 1 ALMA"}</Text>
        </TouchableOpacity>
      </View>

      {data && data.sombras.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma sombra no exército ainda.</Text>
          <Text style={styles.emptySubtext>As sombras aparecerão aqui conforme você as desbloquear.</Text>
        </View>
      ) : (
        <FlatList
          data={data?.sombras ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderSombra}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  title: {
    color: "#aa44ff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 24,
  },
  soulsCard: {
    backgroundColor: "#1a0a2e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3a1a6e",
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  soulsIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  soulsLabel: {
    color: "#9966cc",
    fontSize: 14,
    letterSpacing: 1,
  },
  soulsCount: {
    color: "#cc88ff",
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 8,
  },
  collectButton: {
    backgroundColor: "#3a1a6e",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "#aa44ff",
  },
  collectButtonDisabled: {
    opacity: 0.5,
  },
  collectButtonText: {
    color: "#cc88ff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  list: {
    paddingBottom: 40,
  },
  shadowCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3a1a6e",
    padding: 16,
    marginBottom: 12,
  },
  shadowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  shadowName: {
    color: "#cc88ff",
    fontSize: 16,
    fontWeight: "bold",
  },
  shadowLevel: {
    color: "#9966cc",
    fontSize: 14,
  },
  shadowStats: {
    marginBottom: 12,
  },
  statText: {
    color: "#6b6b8d",
    fontSize: 13,
    marginBottom: 2,
  },
  evolveButton: {
    backgroundColor: "#2a0a4e",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#aa44ff",
  },
  evolveButtonText: {
    color: "#cc88ff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  lockedCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a4e",
    padding: 32,
    alignItems: "center",
    marginTop: 40,
  },
  lockedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockedTitle: {
    color: "#6b6b8d",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  lockedText: {
    color: "#6b6b8d",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a4e",
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b6b8d",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#4a4a6d",
    fontSize: 13,
    textAlign: "center",
  },
});
