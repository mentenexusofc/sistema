import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../services/api";

export default function ClansScreen() {
  const navigation = useNavigation<any>();
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [clans, setClans] = useState<any[]>([]);
  const [meuClan, setMeuClan] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [descricaoNova, setDescricaoNova] = useState("");
  const [tab, setTab] = useState<"lista" | "meu">("lista");

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
        carregarClans();
      }
    } catch {
      setAssinatura(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const carregarClans = async () => {
    try {
      const res = await api.get("/clans");
      setClans(res.data.clans);
    } catch {}
  };

  const entrarClan = async (clanId: string) => {
    try {
      await api.post(`/clans/${clanId}/entrar`);
      Alert.alert("Sucesso", "Você entrou no clã!");
      carregarClans();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erro ao entrar no clã.";
      Alert.alert("Erro", msg);
    }
  };

  const criarClan = async () => {
    if (!nomeNovo.trim()) {
      Alert.alert("Erro", "Digite um nome para o clã.");
      return;
    }
    try {
      await api.post("/clans", { nome: nomeNovo.trim(), descricao: descricaoNova.trim() });
      Alert.alert("Sucesso", "Clã criado!");
      setShowCreate(false);
      setNomeNovo("");
      setDescricaoNova("");
      carregarClans();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erro ao criar clã.";
      Alert.alert("Erro", msg);
    }
  };

  const verDetalhes = async (clanId: string) => {
    try {
      const res = await api.get(`/clans/${clanId}`);
      setMeuClan(res.data.clan);
      setMembers(res.data.membros);
      setTab("meu");
    } catch {}
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
        <Text style={styles.lockedTitle}>Sistema de Clãs</Text>
        <Text style={styles.lockedDesc}>
          Apenas caçadores rank S-Rank podem formar ou entrar em clãs.
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

  if (tab === "meu" && meuClan) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => { setMeuClan(null); setTab("lista"); }}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.clanName}>{meuClan.nome}</Text>
        <Text style={styles.clanDesc}>{meuClan.descricao || "Sem descrição"}</Text>
        <Text style={styles.clanRank}>Rank Médio: {meuClan.rank_medio}</Text>
        <Text style={styles.sectionTitle}>Membros ({members.length})</Text>
        {members.map((m) => (
          <View key={m.id} style={styles.memberCard}>
            <View>
              <Text style={styles.memberName}>{m.nome}</Text>
              <Text style={styles.memberLevel}>Level {m.level} • {m.rank}</Text>
            </View>
            <Text style={[styles.memberCargo, m.cargo === "lider" && styles.cargoLider]}>
              {m.cargo.toUpperCase()}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CLÃS</Text>
      <Text style={styles.subtitle}>Irmandade S-Rank</Text>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreate(!showCreate)}
      >
        <Text style={styles.createButtonText}>
          {showCreate ? "CANCELAR" : "+ CRIAR CLÃ"}
        </Text>
      </TouchableOpacity>

      {showCreate && (
        <View style={styles.createBox}>
          <TextInput
            style={styles.input}
            placeholder="Nome do clã"
            placeholderTextColor="#6b6b8d"
            value={nomeNovo}
            onChangeText={setNomeNovo}
          />
          <TextInput
            style={[styles.input, styles.inputDesc]}
            placeholder="Descrição (opcional)"
            placeholderTextColor="#6b6b8d"
            value={descricaoNova}
            onChangeText={setDescricaoNova}
            multiline
          />
          <TouchableOpacity style={styles.confirmButton} onPress={criarClan}>
            <Text style={styles.confirmButtonText}>CRIAR</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Clãs Disponíveis</Text>
      {clans.length === 0 && (
        <Text style={styles.emptyText}>Nenhum clã cadastrado ainda.</Text>
      )}
      {clans.map((c) => (
        <TouchableOpacity
          key={c.id}
          style={styles.clanCard}
          onPress={() => verDetalhes(c.id)}
        >
          <View style={styles.clanInfo}>
            <Text style={styles.clanCardName}>{c.nome}</Text>
            <Text style={styles.clanCardDetail}>
              Rank {c.rank_medio} • {c.total_membros} membro(s)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.enterButton}
            onPress={() => entrarClan(c.id)}
          >
            <Text style={styles.enterButtonText}>ENTRAR</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
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
    color: "#ffd700",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
  },
  subtitle: {
    color: "#ffaa00",
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
  benefitBullet: { color: "#ffd700", fontSize: 14, marginRight: 10 },
  benefitText: { color: "#a0a0c0", fontSize: 13 },
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
  createButton: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffd700",
  },
  createButtonText: {
    color: "#ffd700",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  createBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  input: {
    backgroundColor: "#0a0a0f",
    borderRadius: 8,
    padding: 12,
    color: "#e0e0e0",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2a2a4e",
    marginBottom: 8,
  },
  inputDesc: { height: 60, textAlignVertical: "top" },
  confirmButton: {
    backgroundColor: "#ffd700",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#0a0a0f",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  sectionTitle: {
    color: "#6b6b8d",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  emptyText: {
    color: "#6b6b8d",
    fontSize: 13,
    textAlign: "center",
    marginVertical: 20,
  },
  clanCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  clanInfo: { flex: 1 },
  clanCardName: { color: "#ffd700", fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  clanCardDetail: { color: "#6b6b8d", fontSize: 12 },
  enterButton: {
    backgroundColor: "#2a2a4e",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  enterButtonText: {
    color: "#00d4ff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  backText: {
    color: "#00d4ff",
    fontSize: 14,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  clanName: {
    color: "#ffd700",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  clanDesc: {
    color: "#a0a0c0",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  clanRank: {
    color: "#6b6b8d",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
  },
  memberCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  memberName: { color: "#e0e0e0", fontSize: 14, fontWeight: "bold" },
  memberLevel: { color: "#6b6b8d", fontSize: 12, marginTop: 2 },
  memberCargo: { color: "#00d4ff", fontSize: 11, fontWeight: "bold", letterSpacing: 1 },
  cargoLider: { color: "#ffd700" },
});
