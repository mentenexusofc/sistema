import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import api from "../services/api";

export default function UpgradeScreen() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await api.post("/assinatura/checkout");
      const { url } = res.data;
      if (url) {
        await Linking.openURL(url);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erro ao iniciar checkout.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>UPGRADE</Text>
      <Text style={styles.subtitle}>Desperte seu poder máximo</Text>

      <View style={styles.currentRankCard}>
        <Text style={styles.currentRankLabel}>SEU RANK ATUAL</Text>
        <Text style={styles.currentRank}>E-Rank</Text>
        <Text style={styles.currentRankDesc}>Plano Free</Text>
      </View>

      <View style={styles.arrow}>↓</View>

      <View style={styles.srankCard}>
        <Text style={styles.srankBadge}>S-Rank</Text>
        <Text style={styles.srankTitle}>Plano Premium</Text>

        <View style={styles.benefitsList}>
          <BenefitItem text="Masmorras Instantâneas (Pomodoro)" />
          <BenefitItem text="Sistema de Clãs" />
          <BenefitItem text="Exército de Sombras" />
          <BenefitItem text="Gráficos de Evolução Detalhados" />
          <BenefitItem text="Suporte Prioritário" />
          <BenefitItem text="Sem limites de missões diárias" />
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, loading && styles.disabledButton]}
          onPress={handleUpgrade}
          disabled={loading}
        >
          <Text style={styles.upgradeButtonText}>
            {loading ? "Abrindo checkout..." : "ASSINAR S-RANK"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.priceText}>Cancelamento a qualquer momento</Text>
      </View>
    </ScrollView>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <Text style={styles.benefitBullet}>✦</Text>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  content: {
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  title: {
    color: "#00d4ff",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
  },
  subtitle: {
    color: "#6b6b8d",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
    textAlign: "center",
  },
  currentRankCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#3a3a5e",
  },
  currentRankLabel: {
    color: "#6b6b8d",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  currentRank: {
    color: "#6b6b8d",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 8,
  },
  currentRankDesc: {
    color: "#4a4a6e",
    fontSize: 14,
    marginTop: 4,
  },
  arrow: {
    color: "#ffd700",
    fontSize: 32,
    marginVertical: 12,
  },
  srankCard: {
    backgroundColor: "#1a0a2e",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    width: "100%",
    borderWidth: 2,
    borderColor: "#ffd700",
  },
  srankBadge: {
    color: "#ffd700",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 3,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: "hidden",
  },
  srankTitle: {
    color: "#e0e0e0",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 12,
  },
  benefitsList: {
    width: "100%",
    marginTop: 20,
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitBullet: {
    color: "#ffd700",
    fontSize: 16,
    marginRight: 12,
  },
  benefitText: {
    color: "#c0c0e0",
    fontSize: 15,
  },
  upgradeButton: {
    backgroundColor: "#ffd700",
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: "#0a0a0f",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  priceText: {
    color: "#6b6b8d",
    fontSize: 12,
    marginTop: 8,
  },
});
