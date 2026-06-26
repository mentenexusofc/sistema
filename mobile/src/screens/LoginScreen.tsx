import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        senha,
      });

      const { token } = response.data;
      await AsyncStorage.setItem("@solo_token", token);
      onLogin();
    } catch (err: any) {
      const msg =
        err.response?.data?.error || "Erro ao conectar ao servidor";
      Alert.alert("Falha no Despertar", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>SOLO LEVELING</Text>
        <Text style={styles.subtitle}>O Despertar</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6b6b8d"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#6b6b8d"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0a0a0f" />
          ) : (
            <Text style={styles.buttonText}>DESPERTAR</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    color: "#00d4ff",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 3,
    marginBottom: 4,
  },
  subtitle: {
    color: "#6b6b8d",
    fontSize: 16,
    marginBottom: 48,
    letterSpacing: 6,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    paddingHorizontal: 16,
    color: "#e0e0e0",
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#00d4ff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#0a0a0f",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 3,
  },
});
