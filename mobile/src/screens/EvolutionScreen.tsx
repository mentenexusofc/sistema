import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LineChart, BarChart } from "react-native-chart-kit";
import Svg, { Polygon, Circle, Line as SvgLine, Text as SvgText } from "react-native-svg";
import api from "../services/api";

const screenWidth = Dimensions.get("window").width - 40;

const LABELS_MES: Record<string, string> = {
  "STR": "Força",
  "AGI": "Agilidade",
  "INT": "Inteligência",
  "VIT": "Vitalidade",
};

const COR_GRADIENTE = ["#00d4ff", "#0066ff"];

function RadarChart({ data, size = 180 }: { data: { label: string; value: number }[]; size?: number }) {
  const center = size / 2;
  const radius = size * 0.38;
  const levels = 5;
  const maxVal = Math.max(...data.map((d) => d.value), 10);

  const angleStep = (Math.PI * 2) / data.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / maxVal) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = data
    .map((d, i) => {
      const p = getPoint(i, d.value);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {Array.from({ length: levels }).map((_, level) => {
          const r = ((level + 1) / levels) * radius;
          const pts = data
            .map((_, i) => {
              const angle = angleStep * i - Math.PI / 2;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            })
            .join(" ");
          return (
            <Polygon
              key={level}
              points={pts}
              fill="none"
              stroke="#2a2a4e"
              strokeWidth={1}
            />
          );
        })}

        {data.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <SvgLine
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#2a2a4e"
              strokeWidth={1}
            />
          );
        })}

        <Polygon points={polygonPoints} fill="rgba(0, 212, 255, 0.15)" stroke="#00d4ff" strokeWidth={2} />

        {data.map((d, i) => {
          const p = getPoint(i, d.value);
          return <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#00d4ff" />;
        })}

        {data.map((d, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const labelR = radius + 24;
          const lx = center + labelR * Math.cos(angle);
          const ly = center + labelR * Math.sin(angle);
          return (
            <SvgText
              key={i}
              x={lx}
              y={ly}
              fill="#a0a0c0"
              fontSize={11}
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>

      <View style={styles.radarLegend}>
        {data.map((d, i) => (
          <View key={i} style={styles.radarLegendItem}>
            <Text style={[styles.radarLegendLabel, { color: "#a0a0c0" }]}>
              {LABELS_MES[d.label] || d.label}:
            </Text>
            <Text style={[styles.radarLegendValue, { color: "#00d4ff" }]}>
              {d.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function EvolutionScreen() {
  const navigation = useNavigation<any>();
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [xpDiario, setXpDiario] = useState<any[]>([]);
  const [missoesDiario, setMissoesDiario] = useState<any[]>([]);
  const [atributos, setAtributos] = useState<any>(null);
  const [periodo, setPeriodo] = useState<7 | 30>(7);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarUsuario();
    }, [])
  );

  const carregarUsuario = async () => {
    try {
      const res = await api.get("/auth/me");
      setAssinatura(res.data.user.assinatura);
      if (res.data.user.assinatura === "s-rank") {
        carregarEvolucao();
      }
    } catch {
      setAssinatura(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const carregarEvolucao = async () => {
    setLoadingData(true);
    setErro(null);
    try {
      const res = await api.get("/users/evolucao");
      setXpDiario(res.data.xp_diario || []);
      setMissoesDiario(res.data.missoes_diario || []);
      setAtributos(res.data.atributos);
    } catch (err: any) {
      setErro(err?.response?.data?.error || "Erro ao carregar dados de evolução.");
    } finally {
      setLoadingData(false);
    }
  };

  const filtrarPorPeriodo = (dados: any[], dias: number) => {
    if (!dados || dados.length === 0) return [];
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    return dados.filter((d) => new Date(d.dia + "T00:00:00") >= limite);
  };

  const prepararDadosGrafico = (dados: any[], campo: string) => {
    const filtrados = filtrarPorPeriodo(dados, periodo);
    return {
      labels: filtrados.slice(-7).map((d) => {
        const parts = d.dia.split("-");
        return `${parts[2]}/${parts[1]}`;
      }),
      datasets: [
        {
          data: filtrados.slice(-7).map((d) => Number(d[campo])),
          color: () => "#00d4ff",
          strokeWidth: 2,
        },
      ],
    };
  };

  if (loadingUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (assinatura !== "s-rank") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.lockedIcon}>📊</Text>
        <Text style={styles.lockedTitle}>Gráficos de Evolução</Text>
        <Text style={styles.lockedDesc}>
          Apenas caçadores rank S-Rank podem visualizar seus gráficos de evolução.
        </Text>
        <View style={styles.benefitsBox}>
          <Text style={styles.benefitsTitle}>Ao assinar S-Rank você ganha:</Text>
          <BenefitItem text="Gráfico de XP ganho por dia" />
          <BenefitItem text="Radar de atributos (STR, AGI, INT, VIT)" />
          <BenefitItem text="Gráfico de missões completadas" />
          <BenefitItem text="Masmorras Instantâneas" />
          <BenefitItem text="Sistema de Clãs e Exército de Sombras" />
        </View>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate("Upgrade")}
        >
          <Text style={styles.upgradeButtonText}>DESPERTAR PODER</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (erro) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{erro}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={carregarEvolucao}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadingData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Carregando dados de evolução...</Text>
      </View>
    );
  }

  const xpFiltrado = filtrarPorPeriodo(xpDiario, periodo);
  const missoesFiltrado = filtrarPorPeriodo(missoesDiario, periodo);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>EVOLUÇÃO</Text>
      <Text style={styles.subtitle}>Gráficos do Hunter</Text>

      <View style={styles.periodoRow}>
        <TouchableOpacity
          style={[styles.periodoBtn, periodo === 7 && styles.periodoBtnAtivo]}
          onPress={() => setPeriodo(7)}
        >
          <Text style={[styles.periodoBtnText, periodo === 7 && styles.periodoBtnTextAtivo]}>
            7 DIAS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodoBtn, periodo === 30 && styles.periodoBtnAtivo]}
          onPress={() => setPeriodo(30)}
        >
          <Text style={[styles.periodoBtnText, periodo === 30 && styles.periodoBtnTextAtivo]}>
            30 DIAS
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚔ XP por Dia</Text>
        {xpFiltrado.length > 0 ? (
          <LineChart
            data={prepararDadosGrafico(xpDiario, "xp_ganho")}
            width={screenWidth - 40}
            height={200}
            yAxisSuffix=""
            yAxisLabel=""
            chartConfig={{
              backgroundColor: "#1a1a2e",
              backgroundGradientFrom: "#1a1a2e",
              backgroundGradientTo: "#0a0a0f",
              decimalCount: 0,
              color: (opacity = 1) => `rgba(0, 212, 255, ${opacity})`,
              labelColor: () => "#6b6b8d",
              propsForDots: { r: "4", strokeWidth: "2", stroke: "#00d4ff" },
              propsForBackgroundLines: { stroke: "#2a2a4e" },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.emptyText}>Nenhum XP registrado nos últimos {periodo} dias.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Missões por Dia</Text>
        {missoesFiltrado.length > 0 ? (
          <BarChart
            data={prepararDadosGrafico(missoesDiario, "quantidade")}
            width={screenWidth - 40}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#1a1a2e",
              backgroundGradientFrom: "#1a1a2e",
              backgroundGradientTo: "#0a0a0f",
              decimalCount: 0,
              color: (opacity = 1) => `rgba(0, 212, 255, ${opacity})`,
              labelColor: () => "#6b6b8d",
              propsForBackgroundLines: { stroke: "#2a2a4e" },
            }}
            style={styles.chart}
          />
        ) : (
          <Text style={styles.emptyText}>Nenhuma missão concluída nos últimos {periodo} dias.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Atributos</Text>
        {atributos ? (
          <RadarChart
            data={[
              { label: "STR", value: atributos.str },
              { label: "AGI", value: atributos.agi },
              { label: "INT", value: atributos.int },
              { label: "VIT", value: atributos.vit },
            ]}
            size={200}
          />
        ) : (
          <Text style={styles.emptyText}>Nenhum atributo encontrado.</Text>
        )}
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
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  content: { padding: 20, paddingTop: 60, alignItems: "center" },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  loadingText: { color: "#6b6b8d", fontSize: 16, marginTop: 16, textAlign: "center" },
  errorText: { color: "#ff4444", fontSize: 14, textAlign: "center", marginTop: 40 },
  retryButton: {
    backgroundColor: "#2a2a4e",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
    alignSelf: "center",
  },
  retryButtonText: { color: "#00d4ff", fontSize: 14, fontWeight: "bold" },
  title: {
    color: "#00d4ff",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
  },
  subtitle: {
    color: "#4a8cff",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 2,
  },
  lockedIcon: { fontSize: 48, marginTop: 20, marginBottom: 12 },
  lockedTitle: {
    color: "#e0e0e0",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  lockedDesc: {
    color: "#6b6b8d",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  benefitsBox: {
    backgroundColor: "#1a0a2e",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#3a1a4e",
  },
  benefitsTitle: {
    color: "#c0c0e0",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitBullet: {
    color: "#ffd700",
    fontSize: 14,
    marginRight: 10,
  },
  benefitText: {
    color: "#a0a0c0",
    fontSize: 13,
  },
  upgradeButton: {
    backgroundColor: "#ffd700",
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginTop: 24,
  },
  upgradeButtonText: {
    color: "#0a0a0f",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  periodoRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  periodoBtn: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  periodoBtnAtivo: {
    borderColor: "#00d4ff",
    backgroundColor: "#0a1a2e",
  },
  periodoBtnText: {
    color: "#6b6b8d",
    fontSize: 13,
    fontWeight: "bold",
  },
  periodoBtnTextAtivo: {
    color: "#00d4ff",
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  cardTitle: {
    color: "#e0e0e0",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
    marginLeft: -8,
  },
  emptyText: {
    color: "#6b6b8d",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 20,
  },
  radarLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  radarLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  radarLegendLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  radarLegendValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
