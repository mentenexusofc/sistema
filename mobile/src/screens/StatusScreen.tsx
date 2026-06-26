import { useCallback, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../services/api";
import { useCountdown } from "../hooks/useCountdown";

interface UserAttributes {
  level: number;
  xp_total: number;
  str: number;
  agi: number;
  int: number;
  vit: number;
  pontos_atributo: number;
}

interface User {
  id: string;
  nome: string;
  email: string;
  rank: string;
  assinatura: string;
  modo_vermelho: boolean;
  penalidade_expira_em: string | null;
  criado_em: string;
  level: number;
  xp_total: number;
  str: number;
  agi: number;
  int: number;
  vit: number;
  pontos_atributo: number;
}

export default function StatusScreen() {
  const navigation = useNavigation<any>();
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

  function xpParaProximoNivel(level: number): number {
    return level * 1000;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erro ao carregar dados</Text>
      </View>
    );
  }

  const xpNeeded = xpParaProximoNivel(user.level);
  const xpProgress = Math.min(user.xp_total / xpNeeded, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>STATUS</Text>

      {user.modo_vermelho && (
        <View style={styles.redBanner}>
          <Text style={styles.redBannerText}>⚠ MODO VERMELHO ATIVO</Text>
          <Text style={styles.redBannerSubtext}>Complete a missão de punição para sair</Text>
          {timer && timer !== "Expirado" && (
            <Text style={styles.timerText}>{timer}</Text>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.rankText}>{user.rank}</Text>
        <Text style={styles.nomeText}>{user.nome}</Text>
        <Text style={styles.levelText}>Nível {user.level}</Text>

        <View style={styles.xpContainer}>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]} />
          </View>
          <Text style={styles.xpText}>
            {user.xp_total} / {xpNeeded} XP
          </Text>
        </View>
      </View>

      <View style={styles.atributosContainer}>
        <Text style={styles.sectionTitle}>ATRIBUTOS</Text>
        <View style={styles.atributoRow}>
          <Text style={styles.atributoLabel}>STR</Text>
          <View style={styles.atributoBarBg}>
            <View style={[styles.atributoBarFill, { width: `${(user.str / 50) * 100}%`, backgroundColor: "#ff4444" }]} />
          </View>
          <Text style={styles.atributoValue}>{user.str}</Text>
        </View>
        <View style={styles.atributoRow}>
          <Text style={styles.atributoLabel}>AGI</Text>
          <View style={styles.atributoBarBg}>
            <View style={[styles.atributoBarFill, { width: `${(user.agi / 50) * 100}%`, backgroundColor: "#44ff44" }]} />
          </View>
          <Text style={styles.atributoValue}>{user.agi}</Text>
        </View>
        <View style={styles.atributoRow}>
          <Text style={styles.atributoLabel}>INT</Text>
          <View style={styles.atributoBarBg}>
            <View style={[styles.atributoBarFill, { width: `${(user.int / 50) * 100}%`, backgroundColor: "#4488ff" }]} />
          </View>
          <Text style={styles.atributoValue}>{user.int}</Text>
        </View>
        <View style={styles.atributoRow}>
          <Text style={styles.atributoLabel}>VIT</Text>
          <View style={styles.atributoBarBg}>
            <View style={[styles.atributoBarFill, { width: `${(user.vit / 50) * 100}%`, backgroundColor: "#ffaa00" }]} />
          </View>
          <Text style={styles.atributoValue}>{user.vit}</Text>
        </View>

        {user.pontos_atributo > 0 && (
          <Text style={styles.pontosText}>
            Pontos disponíveis: {user.pontos_atributo}
          </Text>
        )}

        <TouchableOpacity
          style={styles.distribuirBtn}
          onPress={() => navigation.navigate("DistribuirAtributos")}
        >
          <Text style={styles.distribuirBtnText}>
            {user.pontos_atributo > 0
              ? `DISTRIBUIR (${user.pontos_atributo})`
              : "DISTRIBUIR ATRIBUTOS"}
          </Text>
        </TouchableOpacity>
      </View>
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
    color: "#00d4ff",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a4e",
    marginBottom: 24,
  },
  rankText: {
    color: "#00d4ff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 4,
  },
  nomeText: {
    color: "#e0e0e0",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  levelText: {
    color: "#6b6b8d",
    fontSize: 14,
    marginBottom: 16,
  },
  xpContainer: {
    width: "100%",
    alignItems: "center",
  },
  xpBarBg: {
    width: "100%",
    height: 12,
    backgroundColor: "#2a2a4e",
    borderRadius: 6,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: "#00d4ff",
    borderRadius: 6,
  },
  xpText: {
    color: "#6b6b8d",
    fontSize: 12,
    marginTop: 6,
  },
  atributosContainer: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  sectionTitle: {
    color: "#6b6b8d",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 16,
  },
  atributoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  atributoLabel: {
    color: "#e0e0e0",
    fontSize: 14,
    fontWeight: "bold",
    width: 40,
  },
  atributoBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: "#2a2a4e",
    borderRadius: 5,
    overflow: "hidden",
    marginHorizontal: 12,
  },
  atributoBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  atributoValue: {
    color: "#e0e0e0",
    fontSize: 14,
    fontWeight: "bold",
    width: 30,
    textAlign: "right",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  redBanner: {
    backgroundColor: "#441111",
    borderColor: "#ff4444",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
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
  pontosText: {
    color: "#00d4ff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  distribuirBtn: {
    backgroundColor: "#2a2a4e",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#00d4ff",
  },
  distribuirBtnText: {
    color: "#00d4ff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
