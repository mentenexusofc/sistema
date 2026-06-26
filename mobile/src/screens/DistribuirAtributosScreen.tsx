import { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import api from "../services/api";

interface Atributos {
  str: number;
  agi: number;
  int: number;
  vit: number;
  pontos_atributo: number;
}

export default function DistribuirAtributosScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [base, setBase] = useState<Atributos | null>(null);
  const [alloc, setAlloc] = useState({ str: 0, agi: 0, int: 0, vit: 0 });

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      const u = res.data.user;
      setBase({
        str: u.str,
        agi: u.agi,
        int: u.int,
        vit: u.vit,
        pontos_atributo: u.pontos_atributo,
      });
    }).catch(() => {
      Alert.alert("Erro", "Não foi possível carregar seus atributos.");
    }).finally(() => setLoading(false));
  }, []);

  const used = alloc.str + alloc.agi + alloc.int + alloc.vit;
  const available = (base?.pontos_atributo ?? 0);

  function change(attr: "str" | "agi" | "int" | "vit", delta: number) {
    setAlloc((prev) => {
      const next = prev[attr] + delta;
      if (next < 0) return prev;
      const newTotal = used + delta;
      if (newTotal > available) return prev;
      return { ...prev, [attr]: next };
    });
  }

  async function handleConfirm() {
    if (used === 0) return;
    setSaving(true);
    try {
      await api.post("/atributos/distribuir", alloc);
      Alert.alert("Sucesso", "Atributos distribuídos!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erro ao distribuir pontos";
      Alert.alert("Erro", msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DISTRIBUIR ATRIBUTOS</Text>

      <Text style={styles.pointsText}>
        Pontos disponíveis: <Text style={styles.pointsValue}>{available}</Text>
      </Text>

      <Text style={styles.usedText}>
        Pontos a distribuir: {used}
      </Text>

      <View style={styles.attrContainer}>
        {([
          { key: "str", label: "STR", color: "#ff4444" },
          { key: "agi", label: "AGI", color: "#44ff44" },
          { key: "int", label: "INT", color: "#4488ff" },
          { key: "vit", label: "VIT", color: "#ffaa00" },
        ] as const).map(({ key, label, color }) => (
          <View key={key} style={styles.attrRow}>
            <Text style={[styles.attrLabel, { color }]}>{label}</Text>
            <Text style={styles.attrValue}>{base![key] + alloc[key]}</Text>
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => change(key, -1)}
              >
                <Text style={styles.btnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.allocText}>+{alloc[key]}</Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => change(key, 1)}
              >
                <Text style={styles.btnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, used === 0 && styles.confirmBtnDisabled]}
        disabled={used === 0 || saving}
        onPress={handleConfirm}
      >
        {saving ? (
          <ActivityIndicator color="#0a0a0f" />
        ) : (
          <Text style={styles.confirmBtnText}>CONFIRMAR</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelBtnText}>CANCELAR</Text>
      </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 24,
  },
  pointsText: {
    color: "#e0e0e0",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 4,
  },
  pointsValue: {
    color: "#00d4ff",
    fontWeight: "bold",
    fontSize: 18,
  },
  usedText: {
    color: "#6b6b8d",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  attrContainer: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a4e",
    marginBottom: 24,
  },
  attrRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  attrLabel: {
    fontSize: 18,
    fontWeight: "bold",
    width: 45,
  },
  attrValue: {
    color: "#e0e0e0",
    fontSize: 20,
    fontWeight: "bold",
    width: 40,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 12,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a4e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3a5e",
  },
  btnText: {
    color: "#00d4ff",
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 24,
  },
  allocText: {
    color: "#6b6b8d",
    fontSize: 16,
    fontWeight: "bold",
    width: 30,
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: "#00d4ff",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: "#0a0a0f",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: "#6b6b8d",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
