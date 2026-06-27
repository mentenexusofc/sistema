import { useState, useEffect } from "react";

export function useCountdown(expiraEm: string | null) {
  const [restante, setRestante] = useState("");

  useEffect(() => {
    if (!expiraEm) {
      setRestante("");
      return;
    }

    const atualizar = () => {
      const diff = new Date(expiraEm).getTime() - Date.now();
      if (diff <= 0) {
        setRestante("Expirado");
        return;
      }
      const horas = Math.floor(diff / 3600000);
      const minutos = Math.floor((diff % 3600000) / 60000);
      const segundos = Math.floor((diff % 60000) / 1000);
      setRestante(
        `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`
      );
    };

    atualizar();
    const id = setInterval(atualizar, 1000);
    return () => clearInterval(id);
  }, [expiraEm]);

  return restante;
}
