import { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

interface Achievement {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  requisito_tipo: string;
  requisito_valor: number;
  xp_recompensa: number;
  desbloqueado_em: string | null;
}

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [novasConquistas, setNovasConquistas] = useState(0);

  useFocusEffect(
    useCallback(() => {
      carregarConquistas();
    }, [])
  );

  async function carregarConquistas() {
    try {
      const res = await api.get("/achievements");
      setAchievements(res.data.achievements);
      const novas = res.data.novas_conquistas;
      setNovasConquistas(novas);
      if (novas > 0) {
        Alert.alert("🏆 Conquistas!", `Você desbloqueou ${novas} nova(s) conquista(s) e ganhou XP!`);
      }
    } catch {
      // erro silencioso
    }
  }

  const iconeMap: Record<string, string> = {
    quest: "📋",
    level: "⭐",
    shadow: "💀",
    dungeon: "🏰",
    clan: "👥",
    xp: "✨",
  };

  function renderAchievement({ item }: { item: Achievement }) {
    const desbloqueada = !!item.desbloqueado_em;
    const icone = iconeMap[item.icone] || "🏆";

    return (
      <View style={[styles.card, desbloqueada ? styles.cardDesbloqueada : styles.cardBloqueada]}>
        <View style={styles.cardHeader}>
          <Text style={styles.icone}>{desbloqueada ? icone : "🔒"}</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.nome, desbloqueada && styles.nomeDesbloqueada]}>
              {desbloqueada ? item.nome : "???"}
            </Text>
            <Text style={styles.descricao}>
              {desbloqueada ? item.descricao : "Conquista não desbloqueada"}
            </Text>
          </View>
        </View>
        {desbloqueada && (
          <View style={styles.recompensaBox}>
            <Text style={styles.recompensaTexto}>+{item.xp_recompensa} XP</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONQUISTAS</Text>

      {novasConquistas > 0 && (
        <View style={styles.novasBanner}>
          <Text style={styles.novasBannerText}>
            🎉 {novasConquistas} nova(s) conquista(s) desbloqueada(s)!
          </Text>
        </View>
      )}

      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        renderItem={renderAchievement}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma conquista disponível.</Text>
        }
      />
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
    color: "#ffd700",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 24,
  },
  novasBanner: {
    backgroundColor: "#2a2a0a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffd700",
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  novasBannerText: {
    color: "#ffd700",
    fontSize: 14,
    fontWeight: "bold",
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardDesbloqueada: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#ffd700",
  },
  cardBloqueada: {
    backgroundColor: "#111120",
    borderWidth: 1,
    borderColor: "#2a2a3e",
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icone: {
    fontSize: 32,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  nome: {
    color: "#6b6b8d",
    fontSize: 16,
    fontWeight: "bold",
  },
  nomeDesbloqueada: {
    color: "#ffd700",
  },
  descricao: {
    color: "#6b6b8d",
    fontSize: 12,
    marginTop: 4,
  },
  recompensaBox: {
    backgroundColor: "#2a2a0a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffd700",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recompensaTexto: {
    color: "#ffd700",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#6b6b8d",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
