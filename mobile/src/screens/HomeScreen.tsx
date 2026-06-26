import { useCallback, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { useCountdown } from "../hooks/useCountdown";

interface User {
  nome: string;
  rank: string;
  modo_vermelho: boolean;
  penalidade_expira_em: string | null;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useCountdown(user?.penalidade_expira_em ?? null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.get("/auth/me").then((res) => {
        setUser(res.data.user);
      }).catch(() => {
        // erro silencioso
      }).finally(() => {
        setLoading(false);
      });
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SOLO LEVELING</Text>
      {user && <Text style={styles.subtitle}>Bem-vindo, {user.nome}</Text>}

      {user?.modo_vermelho && (
        <View style={styles.redBanner}>
          <Text style={styles.redBannerText}>⚠ MODO VERMELHO ATIVO</Text>
          <Text style={styles.redBannerSubtext}>Complete a missão de punição para sair</Text>
          {timer && timer !== "Expirado" && (
            <Text style={styles.timerText}>{timer}</Text>
          )}
        </View>
      )}

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Status")}
        >
          <Text style={styles.menuButtonText}>Status do Hunter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Quests")}
        >
          <Text style={styles.menuButtonText}>Missões</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#00d4ff",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  subtitle: {
    color: "#6b6b8d",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 48,
  },
  menuContainer: {
    width: "100%",
    gap: 16,
  },
  menuButton: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a4e",
    alignItems: "center",
  },
  menuButtonText: {
    color: "#00d4ff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  redBanner: {
    backgroundColor: "#441111",
    borderColor: "#ff4444",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
    width: "100%",
  },
  redBannerText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  redBannerSubtext: {
    color: "#ff8888",
    fontSize: 12,
    marginTop: 4,
  },
  timerText: {
    color: "#ffaa00",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    fontVariant: ["tabular-nums"],
  },
});
