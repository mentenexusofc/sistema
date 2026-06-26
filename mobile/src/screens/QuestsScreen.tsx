import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import api from "../services/api";

interface Quest {
  id: string;
  tipo: string;
  descricao: string;
  xp_recompensa: number;
  concluida: boolean;
  data: string;
}

interface QuestSection {
  title: string;
  data: Quest[];
}

function formatarData(dataStr: string) {
  const [ano, mes, dia] = dataStr.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  if (data.toDateString() === hoje.toDateString()) return "Hoje";
  if (data.toDateString() === ontem.toDateString()) return "Ontem";
  return `${dia}/${mes}/${ano}`;
}

function agruparPorData(quests: Quest[]): QuestSection[] {
  const map = new Map<string, Quest[]>();
  for (const q of quests) {
    const key = q.data;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([title, data]) => ({ title, data }));
}

interface QuestTemplate {
  id: string;
  tipo: string;
  descricao: string;
  xp_recompensa: number;
  frequencia: string;
  criado_em: string;
}

function hojeStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function QuestsScreen() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [xp, setXp] = useState("");
  const [modoVermelho, setModoVermelho] = useState(false);
  const [metaXpDiaria, setMetaXpDiaria] = useState(1000);
  const [xpHoje, setXpHoje] = useState(0);
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [metaInput, setMetaInput] = useState("");

  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateTipo, setTemplateTipo] = useState("");
  const [templateDescricao, setTemplateDescricao] = useState("");
  const [templateXp, setTemplateXp] = useState("");
  const [templateFreq, setTemplateFreq] = useState("diaria");

  const sections = useMemo(() => agruparPorData(quests), [quests]);

  const hoje = hojeStr();

  const progressoHoje = useMemo(() => {
    const hojeQuests = quests.filter((q) => q.data === hoje);
    const total = hojeQuests.length;
    const concluidas = hojeQuests.filter((q) => q.concluida).length;
    return { total, concluidas };
  }, [quests, hoje]);

  const fetchQuests = async () => {
    try {
      const res = await api.get("/quests");
      setQuests(res.data.quests);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar as missões.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatus = async () => {
    try {
      const res = await api.get("/auth/me");
      setModoVermelho(res.data.user.modo_vermelho);
      setMetaXpDiaria(res.data.user.meta_xp_diaria ?? 1000);
      setXpHoje(res.data.user.xp_hoje ?? 0);
    } catch {
      // silencioso
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/quests/templates");
      setTemplates(res.data.templates);
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    fetchQuests();
    fetchUserStatus();
    fetchTemplates();
  }, []);

  const handleToggleComplete = async (id: string) => {
    try {
      await api.patch(`/quests/${id}`);
      fetchQuests();
      fetchUserStatus();
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar a missão.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Excluir Missão", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/quests/${id}`);
            fetchQuests();
          } catch {
            Alert.alert("Erro", "Não foi possível excluir a missão.");
          }
        },
      },
    ]);
  };

  const handleCreate = async () => {
    if (!tipo.trim() || !descricao.trim()) {
      Alert.alert("Atenção", "Preencha tipo e descrição da missão.");
      return;
    }

    try {
      await api.post("/quests", {
        tipo: tipo.trim(),
        descricao: descricao.trim(),
        xp_recompensa: xp ? Number(xp) : 0,
      });
      setShowForm(false);
      setTipo("");
      setDescricao("");
      setXp("");
      fetchQuests();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Não foi possível criar a missão.";
      Alert.alert("Erro", msg);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateTipo.trim() || !templateDescricao.trim()) {
      Alert.alert("Atenção", "Preencha tipo e descrição do template.");
      return;
    }

    try {
      await api.post("/quests/templates", {
        tipo: templateTipo.trim(),
        descricao: templateDescricao.trim(),
        xp_recompensa: templateXp ? Number(templateXp) : 0,
        frequencia: templateFreq,
      });
      setTemplateTipo("");
      setTemplateDescricao("");
      setTemplateXp("");
      setTemplateFreq("diaria");
      fetchTemplates();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Não foi possível criar o template.";
      Alert.alert("Erro", msg);
    }
  };

  const handleUpdateMeta = async () => {
    const valor = Number(metaInput);
    if (!Number.isInteger(valor) || valor < 100) {
      Alert.alert("Atenção", "A meta deve ser um número inteiro mínimo de 100.");
      return;
    }
    try {
      await api.patch("/users/meta-xp", { meta_xp_diaria: valor });
      setMetaXpDiaria(valor);
      setShowMetaForm(false);
      setMetaInput("");
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar a meta.");
    }
  };

  const handleDeleteTemplate = (id: string) => {
    Alert.alert("Excluir Template", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/quests/templates/${id}`);
            fetchTemplates();
          } catch {
            Alert.alert("Erro", "Não foi possível excluir o template.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando missões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QUEST LOG</Text>

      {progressoHoje.total > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progresso Diário: {progressoHoje.concluidas}/{progressoHoje.total} missões
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(progressoHoje.concluidas / progressoHoje.total) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.metaHeader}>
          <Text style={styles.progressText}>
            Meta XP: {xpHoje}/{metaXpDiaria} XP
          </Text>
          <TouchableOpacity onPress={() => { setMetaInput(String(metaXpDiaria)); setShowMetaForm(true); }}>
            <Text style={styles.metaEditButton}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              styles.xpProgressFill,
              { width: `${Math.min((xpHoje / metaXpDiaria) * 100, 100)}%` },
              xpHoje >= metaXpDiaria && styles.xpProgressComplete,
            ]}
          />
        </View>
        {xpHoje >= metaXpDiaria && (
          <Text style={styles.bonusText}>Bônus de XP já concedido hoje!</Text>
        )}
      </View>

      {showMetaForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nova meta de XP diária"
            placeholderTextColor="#6b6b8d"
            value={metaInput}
            onChangeText={setMetaInput}
            keyboardType="numeric"
          />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateMeta}>
              <Text style={styles.saveButtonText}>Salvar Meta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowMetaForm(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {modoVermelho && (
        <View style={styles.redBanner}>
          <Text style={styles.redBannerText}>⚠ MODO VERMELHO</Text>
          <Text style={styles.redBannerSubtext}>
            Complete a missão de punição para criar novas missões
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.toggleTemplatesButton}
        onPress={() => setShowTemplates(!showTemplates)}
      >
        <Text style={styles.toggleTemplatesText}>
          {showTemplates ? "▲" : "▼"} Templates ({templates.length})
        </Text>
      </TouchableOpacity>

      {showTemplates && (
        <View style={styles.templatesSection}>
          <Text style={styles.templatesSectionTitle}>Meus Templates</Text>

          <View style={styles.templateForm}>
            <TextInput
              style={styles.input}
              placeholder="Tipo"
              placeholderTextColor="#6b6b8d"
              value={templateTipo}
              onChangeText={setTemplateTipo}
            />
            <TextInput
              style={[styles.input, styles.descInput]}
              placeholder="Descrição"
              placeholderTextColor="#6b6b8d"
              value={templateDescricao}
              onChangeText={setTemplateDescricao}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="XP"
              placeholderTextColor="#6b6b8d"
              value={templateXp}
              onChangeText={setTemplateXp}
              keyboardType="numeric"
            />
            <View style={styles.freqSelector}>
              <TouchableOpacity
                style={[styles.freqOption, templateFreq === "diaria" && styles.freqActive]}
                onPress={() => setTemplateFreq("diaria")}
              >
                <Text style={[styles.freqOptionText, templateFreq === "diaria" && styles.freqActiveText]}>Diária</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.freqOption, templateFreq === "semanal" && styles.freqActive]}
                onPress={() => setTemplateFreq("semanal")}
              >
                <Text style={[styles.freqOptionText, templateFreq === "semanal" && styles.freqActiveText]}>Semanal</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleCreateTemplate}>
              <Text style={styles.saveButtonText}>Adicionar Template</Text>
            </TouchableOpacity>
          </View>

          {templates.map((tmpl) => (
            <View key={tmpl.id} style={styles.templateCard}>
              <View style={styles.templateInfo}>
                <Text style={styles.templateTipo}>{tmpl.tipo.toUpperCase()}</Text>
                <Text style={styles.templateDesc}>{tmpl.descricao}</Text>
                <Text style={styles.templateMeta}>
                  {tmpl.xp_recompensa} XP · {tmpl.frequencia === "diaria" ? "Diária" : "Semanal"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.templateDelete}
                onPress={() => handleDeleteTemplate(tmpl.id)}
              >
                <Text style={styles.templateDeleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {templates.length === 0 && (
            <Text style={styles.emptyText}>Nenhum template ainda. Crie um acima!</Text>
          )}
        </View>
      )}

      {showForm ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Tipo (ex: diaria, semanal)"
            placeholderTextColor="#6b6b8d"
            value={tipo}
            onChangeText={setTipo}
          />
          <TextInput
            style={[styles.input, styles.descInput]}
            placeholder="Descrição da missão"
            placeholderTextColor="#6b6b8d"
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="XP de recompensa"
            placeholderTextColor="#6b6b8d"
            value={xp}
            onChangeText={setXp}
            keyboardType="numeric"
          />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.saveButton} onPress={handleCreate}>
              <Text style={styles.saveButtonText}>Criar Missão</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : !modoVermelho ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.addButtonText}>+ Nova Missão</Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={sections}
        keyExtractor={(section) => section.title}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhuma missão ainda. Crie sua primeira!
          </Text>
        }
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.sectionHeader}>
              {formatarData(section.title)}
            </Text>
            {section.data.map((quest) => (
              <View
                key={quest.id}
                style={[
                  styles.questCard,
                  quest.concluida && styles.questDone,
                  quest.tipo === "punição" && !quest.concluida && styles.questPunicao,
                ]}
              >
                <View style={styles.questHeader}>
                  <Text style={styles.questTipo}>{quest.tipo.toUpperCase()}</Text>
                  <Text style={[styles.questXp, quest.xp_recompensa < 0 && styles.questXpNegativo]}>
                    {quest.xp_recompensa >= 0 ? "+" : ""}{quest.xp_recompensa} XP
                  </Text>
                </View>
                <Text style={styles.questDesc}>{quest.descricao}</Text>
                <View style={styles.questActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      quest.concluida ? styles.actionUndo : styles.actionCheck,
                    ]}
                    onPress={() => handleToggleComplete(quest.id)}
                  >
                    <Text style={styles.actionButtonText}>
                      {quest.concluida ? "↩" : "✓"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionDelete]}
                    onPress={() => handleDelete(quest.id)}
                  >
                    <Text style={styles.actionButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      />
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
  addButton: {
    backgroundColor: "#1a1a2e",
    borderColor: "#00d4ff",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#00d4ff",
    fontSize: 16,
    fontWeight: "bold",
  },
  form: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#0a0a0f",
    color: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#2a2a4a",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  descInput: {
    height: 80,
    textAlignVertical: "top",
  },
  formButtons: {
    flexDirection: "row",
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#00d4ff",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#0a0a0f",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    borderColor: "#6b6b8d",
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6b6b8d",
    fontSize: 14,
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
  questCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#00d4ff",
  },
  questDone: {
    opacity: 0.5,
    borderLeftColor: "#4caf50",
  },
  questPunicao: {
    borderLeftColor: "#ff4444",
    borderLeftWidth: 4,
  },
  questHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  questTipo: {
    color: "#00d4ff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  questXp: {
    color: "#ffd700",
    fontSize: 13,
    fontWeight: "bold",
  },
  questXpNegativo: {
    color: "#ff4444",
  },
  questDesc: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 20,
  },
  questActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  actionCheck: {
    backgroundColor: "#4caf50",
  },
  actionUndo: {
    backgroundColor: "#ff9800",
  },
  actionDelete: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  metaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaEditButton: {
    color: "#00d4ff",
    fontSize: 12,
    fontWeight: "bold",
  },
  progressContainer: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  xpProgressFill: {
    backgroundColor: "#7c4dff",
  },
  xpProgressComplete: {
    backgroundColor: "#ffd700",
  },
  bonusText: {
    color: "#ffd700",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "center",
  },
  progressText: {
    color: "#e0e0e0",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#0a0a0f",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#00d4ff",
    borderRadius: 4,
  },
  toggleTemplatesButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  toggleTemplatesText: {
    color: "#6b6b8d",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  templatesSection: {
    backgroundColor: "#15152a",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a4a",
  },
  templatesSectionTitle: {
    color: "#00d4ff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 1,
  },
  templateForm: {
    marginBottom: 12,
  },
  freqSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  freqOption: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    alignItems: "center",
  },
  freqActive: {
    borderColor: "#00d4ff",
    backgroundColor: "#0d2d3d",
  },
  freqOptionText: {
    color: "#6b6b8d",
    fontSize: 13,
    fontWeight: "bold",
  },
  freqActiveText: {
    color: "#00d4ff",
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#7c4dff",
  },
  templateInfo: {
    flex: 1,
  },
  templateTipo: {
    color: "#7c4dff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  templateDesc: {
    color: "#e0e0e0",
    fontSize: 13,
    marginTop: 2,
  },
  templateMeta: {
    color: "#6b6b8d",
    fontSize: 11,
    marginTop: 2,
  },
  templateDelete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f44336",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  templateDeleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
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
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  redBannerSubtext: {
    color: "#ff8888",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  sectionHeader: {
    color: "#6b6b8d",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
});
