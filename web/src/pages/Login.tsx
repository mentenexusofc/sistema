import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) {
      setError("Preencha email e senha");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        senha,
      });
      const { token } = response.data;
      localStorage.setItem("@solo_token", token);
      navigate("/home");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form className="login-content" onSubmit={handleLogin}>
        <h1 className="login-title">SOLO LEVELING</h1>
        <p className="login-subtitle">O Despertar</p>

        {error && <p className="login-error">{error}</p>}

        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
        />

        <input
          className="input"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password"
          autoComplete="current-password"
        />

        <button className="btn btn-cyan btn-block" type="submit" disabled={loading}>
          {loading ? "ENTRANDO..." : "DESPERTAR"}
        </button>
      </form>
    </div>
  );
}
