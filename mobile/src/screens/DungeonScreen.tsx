import { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../services/api";

const DURACOES = [15, 25, 30, 45, 60];

export default function DungeonScreen() {
  const navigation = useNavigation<any>();
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [duracao, setDuracao] = useState(25);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [terminaEm, setTerminaEm] = useState<string | null>(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [resultado, setResultado] = useState<{
    xp_recebido: number;
    tempo_cumprido_min: number;
  } | null>(null);
  const [sessoes, setSessoes] = useState<any[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarUsuario();
    }, [])
  );

  const carregarUsuario = async () => {
    try {
      const res = await api.get("/auth/me");
      setAssinatura(res.data.user.assinatura);
    } catch {
      setAssinatura(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (ativo && terminaEm && !pausado) {
      timerRef.current = setInterval(() => {
        const diff = new Date(terminaEm).getTime() - Date.now();
        if (diff <= 0) {
          setTempoRestante(0);
          if (timerRef.current) clearInterval(timerRef.current);
          finalizarSessao(true);
        } else {
          setTempoRestante(Math.ceil(diff / 1000));
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ativo, terminaEm, pausado]);

  const iniciar = async () => {
    try {
      const res = await api.post("/dungeons/iniciar", { duracao_minutos: duracao });
      const { session, termina_em } = res.data;
      setSessionId(session.id);
      setTerminaEm(termina_em);
      const diff = Math.ceil((new Date(termina_em).getTime() - Date.now()) / 1000);
      setTempoRestante(Math.max(0, diff));
      setAtivo(true);
      setPausado(false);
      setResultado(null);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erro ao iniciar masmorra.";
      Alert.alert("Erro", msg);
    }
  };

  const finalizarSessao = async (automatico = false) => {
    if (!sessionId) return;

    setFinalizando(true);
    try {
      const res = await api.post("/dungeons/finalizar", { session_id: sessionId });
      setResultado(res.data);
      setAtivo(false);
      setSessionId(null);
      setTerminaEm(null);
      setPausado(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      carregarSessoes();
    } catch (err: any) {
      if (!automatico) {
        const msg = err?.response?.data?.error || "Erro ao finalizar masmorra.";
        Alert.alert("Erro", msg);
      }
    } finally {
      setFinalizando(false);
    }
  };

  const carregarSessoes = async () => {
    try {
      const res = await api.get("/dungeons/sessoes");
      setSessoes(res.data.sessoes);
    } catch {}
  };

  const formatTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
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
        <Text style={styles.lockedIcon}>🔒</Text>
        <Text style={styles.lockedTitle}>Masmorras Instantâneas</Text>
        <Text style={styles.lockedDesc}>
          Apenas caçadores rank S-Rank podem adentrar as masmorras instantâneas.
        </Text>
        <View style={styles.benefitsBox}>
          <Text style={styles.benefitsTitle}>Ao assinar S-Rank você ganha:</Text>
          <BenefitItem text="Timer Pomodoro com recompensa em XP" />
          <BenefitItem text="Sistema de Clãs" />
          <BenefitItem text="Exército de Sombras" />
          <BenefitItem text="Gráficos de Evolução" />
          <BenefitItem text="Suporte Prioritário" />
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

  const progresso = duracao * 60 > 0 ? 1 - tempoRestante / (duracao * 60) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MASMORRA</Text>
      <Text style={styles.subtitle}>Instantânea</Text>

      {!resultado && !ativo && (
        <>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTempo(duracao * 60)}</Text>
          </View>

          <Text style={styles.label}>Duração</Text>
          <View style={styles.duracaoRow}>
            {DURACOES.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.duracaoBtn, duracao === d && styles.duracaoBtnAtivo]}
                onPress={() => setDuracao(d)}
              >
                <Text
                  style={[
                    styles.duracaoBtnText,
                    duracao === d && styles.duracaoBtnTextAtivo,
                  ]}
                >
                  {d}min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={iniciar}>
            <Text style={styles.startButtonText}>INICIAR MASMORRA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.historyButton} onPress={carregarSessoes}>
            <Text style={styles.historyButtonText}>Ver Histórico</Text>
          </TouchableOpacity>
        </>
      )}

      {ativo && (
        <>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTempo(tempoRestante)}</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(100, progresso * 100))}%` }]}
              />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={() => setPausado(!pausado)}
            >
              <Text style={styles.pauseButtonText}>
                {pausado ? "RETOMAR" : "PAUSAR"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => finalizarSessao()}
              disabled={finalizando}
            >
              <Text style={styles.finishButtonText}>
                {finalizando ? "FINALIZANDO..." : "FINALIZAR"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {resultado && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Masmorra Concluída!</Text>
          <Text style={styles.resultXp}>+{resultado.xp_recebido} XP</Text>
          <Text style={styles.resultTime}>
            Tempo: {resultado.tempo_cumprido_min} min
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setResultado(null)}
          >
            <Text style={styles.startButtonText}>NOVA MASMORRA</Text>
          </TouchableOpacity>
        </View>
      )}

      {sessoes.length > 0 && (
        <View style={styles.historico}>
          <Text style={styles.historicoTitle}>Últimas Sessões</Text>
          {sessoes.slice(0, 5).map((s) => (
            <View key={s.id} style={styles.historicoItem}>
              <Text style={styles.historicoText}>
                {s.duracao_minutos}min — {s.concluida ? `${s.xp_ganho} XP` : "Incompleta"}
              </Text>
              <Text style={styles.historicoDate}>
                {new Date(s.criada_em).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          ))}
        </View>
      )}
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
  loadingText: { color: "#6b6b8d", fontSize: 16, marginTop: 40 },
  title: {
    color: "#ff4444",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
  },
  subtitle: {
    color: "#ff6666",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
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
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#1a1a2e",
    borderWidth: 3,
    borderColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  timerText: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  progressBarBg: {
    width: 160,
    height: 6,
    backgroundColor: "#2a2a4e",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ff4444",
    borderRadius: 3,
  },
  label: {
    color: "#6b6b8d",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  duracaoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  duracaoBtn: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  duracaoBtnAtivo: {
    borderColor: "#ff4444",
    backgroundColor: "#2a0a0a",
  },
  duracaoBtnText: {
    color: "#6b6b8d",
    fontSize: 13,
    fontWeight: "bold",
  },
  duracaoBtnTextAtivo: {
    color: "#ff4444",
  },
  startButton: {
    backgroundColor: "#ff4444",
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  historyButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  historyButtonText: {
    color: "#6b6b8d",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  pauseButton: {
    backgroundColor: "#2a2a4e",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flex: 1,
    alignItems: "center",
  },
  pauseButtonText: {
    color: "#00d4ff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  finishButton: {
    backgroundColor: "#662222",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flex: 1,
    alignItems: "center",
  },
  finishButtonText: {
    color: "#ff6666",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  resultCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffd700",
  },
  resultTitle: {
    color: "#ffd700",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  resultXp: {
    color: "#00ff88",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  resultTime: {
    color: "#6b6b8d",
    fontSize: 14,
    marginBottom: 16,
  },
  historico: {
    width: "100%",
    marginTop: 24,
  },
  historicoTitle: {
    color: "#6b6b8d",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 12,
  },
  historicoItem: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historicoText: {
    color: "#c0c0e0",
    fontSize: 13,
  },
  historicoDate: {
    color: "#6b6b8d",
    fontSize: 12,
  },
});
