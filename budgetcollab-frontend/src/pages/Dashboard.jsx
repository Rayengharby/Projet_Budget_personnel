import { useState, useEffect } from "react";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from "chart.js";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const C = { bg: "#0f1117", surface: "#1a1d27", card: "#21253a", border: "#2e3250", accent: "#6c63ff", green: "#22c55e", red: "#ef4444", yellow: "#f59e0b", text: "#e8eaf6", muted: "#7c82a8" };

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const fmt = n => new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(n || 0);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: C.muted, textAlign: "center", paddingTop: 60 }}>Chargement…</div>;

  const doughnutData = {
    labels: stats?.byCategory?.map(c => `${c.icon} ${c.name}`) || [],
    datasets: [{ data: stats?.byCategory?.map(c => c.total) || [], backgroundColor: stats?.byCategory?.map(c => c.color) || [], borderWidth: 0 }],
  };

  const lineData = {
    labels: stats?.evolution?.map(e => `${e._id.month}/${e._id.year}`) || [],
    datasets: [{
      label: "Dépenses", data: stats?.evolution?.map(e => e.total) || [],
      borderColor: C.accent, backgroundColor: C.accent + "22", fill: true, tension: 0.4,
    }],
  };

  const chartOpts = { responsive: true, plugins: { legend: { labels: { color: C.muted, font: { size: 11 } } } }, scales: { x: { ticks: { color: C.muted }, grid: { color: C.border } }, y: { ticks: { color: C.muted }, grid: { color: C.border } } } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22 }}>Bonjour, {user?.name?.split(" ")[0]} 👋</h2>
        <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>Résumé financier du mois en cours</p>
      </div>

      {stats?.balance < 0 && (
        <div style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 10, padding: "10px 16px", color: C.red, fontSize: 13 }}>
          ⚠️ Attention : vos dépenses dépassent vos revenus ce mois-ci.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <StatCard label="Revenus"       value={fmt(stats?.income)}   color={C.green}  icon="📈" sub="Ce mois-ci" />
        <StatCard label="Dépenses"      value={fmt(stats?.expense)}  color={C.red}    icon="📉" sub="Ce mois-ci" />
        <StatCard label="Solde"         value={fmt(stats?.balance)}  color={stats?.balance >= 0 ? C.green : C.red} icon="💳" sub="Disponible" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
          <h4 style={{ margin: "0 0 16px", color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Répartition</h4>
          <Doughnut data={doughnutData} options={{ plugins: { legend: { position: "bottom", labels: { color: C.muted, font: { size: 10 } } } } }} />
        </div>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
          <h4 style={{ margin: "0 0 16px", color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Évolution des dépenses</h4>
          <Line data={lineData} options={chartOpts} />
        </div>
      </div>
    </div>
  );
}