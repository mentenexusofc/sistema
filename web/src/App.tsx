import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Status from "./pages/Status";
import Quests from "./pages/Quests";
import Inventario from "./pages/Inventario";
import Upgrade from "./pages/Upgrade";
import Dungeon from "./pages/Dungeon";
import Clans from "./pages/Clans";
import Shadow from "./pages/Shadow";
import Achievements from "./pages/Achievements";
import Evolution from "./pages/Evolution";
import DistribuirAtributos from "./pages/DistribuirAtributos";

const NAV_ITEMS = [
  { to: "/home", label: "Home" },
  { to: "/status", label: "Status" },
  { to: "/quests", label: "Quests" },
  { to: "/inventario", label: "Itens" },
  { to: "/upgrade", label: "Upgrade" },
  { to: "/masmorra", label: "Masmorra" },
  { to: "/clans", label: "Clãs" },
  { to: "/sombras", label: "Sombras" },
  { to: "/conquistas", label: "Conquistas" },
  { to: "/evolucao", label: "Evolução" },
];

function Layout({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("@solo_token");

  if (!token) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <nav className="nav-tabs">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default function App() {
  const token = localStorage.getItem("@solo_token");

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/home" /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/home" element={<Layout><Home /></Layout>} />
      <Route path="/status" element={<Layout><Status /></Layout>} />
      <Route path="/quests" element={<Layout><Quests /></Layout>} />
      <Route path="/inventario" element={<Layout><Inventario /></Layout>} />
      <Route path="/upgrade" element={<Layout><Upgrade /></Layout>} />
      <Route path="/masmorra" element={<Layout><Dungeon /></Layout>} />
      <Route path="/clans" element={<Layout><Clans /></Layout>} />
      <Route path="/sombras" element={<Layout><Shadow /></Layout>} />
      <Route path="/conquistas" element={<Layout><Achievements /></Layout>} />
      <Route path="/evolucao" element={<Layout><Evolution /></Layout>} />
      <Route path="/distribuir-atributos" element={<Layout><DistribuirAtributos /></Layout>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
