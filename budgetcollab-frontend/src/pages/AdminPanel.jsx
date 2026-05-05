// AdminPage.jsx - Version améliorée
import { useState, useEffect } from "react";
import api from "../utils/api";

const C = { bg: "#0f1117", surface: "#1a1d27", card: "#21253a", border: "#2e3250", accent: "#6c63ff", green: "#22c55e", red: "#ef4444", yellow: "#f59e0b", text: "#e8eaf6", muted: "#7c82a8" };
const fmt = n => new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(n || 0);

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>{value || 0}</div>
    </div>
  );
}

const TABS = ["Vue d'ensemble", "Utilisateurs", "Budgets partagés"];

export default function AdminPage() {
  const [tab, setTab]             = useState(0);
  const [stats, setStats]         = useState(null);
  const [users, setUsers]         = useState([]);
  const [budgets, setBudgets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [error, setError]         = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [sRes, uRes, bRes] = await Promise.all([
        api.getAdminStats(),
        api.getUsers(),
        api.getSharedBudgets(),
      ]);
      
      // Parse stats
      setStats(sRes || {});
      
      // Parse users - try multiple formats
      let usersArray = [];
      if (uRes) {
        if (Array.isArray(uRes)) usersArray = uRes;
        else if (uRes.users && Array.isArray(uRes.users)) usersArray = uRes.users;
        else if (uRes.data && Array.isArray(uRes.data)) usersArray = uRes.data;
        else if (typeof uRes === 'object') {
          // Look for any array property
          for (let key in uRes) {
            if (Array.isArray(uRes[key])) {
              usersArray = uRes[key];
              break;
            }
          }
        }
      }
      
      // Parse budgets - try multiple formats
      let budgetsArray = [];
      if (bRes) {
        if (Array.isArray(bRes)) budgetsArray = bRes;
        else if (bRes.budgets && Array.isArray(bRes.budgets)) budgetsArray = bRes.budgets;
        else if (bRes.data && Array.isArray(bRes.data)) budgetsArray = bRes.data;
        else if (typeof bRes === 'object') {
          for (let key in bRes) {
            if (Array.isArray(bRes[key])) {
              budgetsArray = bRes[key];
              break;
            }
          }
        }
      }
      
      setUsers(usersArray);
      setBudgets(budgetsArray);
      
      if (usersArray.length === 0) {
        console.warn("No users found in response:", uRes);
      }
      
    } catch (e) { 
      console.error("Failed to load admin data", e);
      setError(e.response?.data?.message || "Erreur de chargement des données");
      setStats({});
      setUsers([]);
      setBudgets([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleActivate = async (id) => {
    try {
      await api.activateUser(id);
      setActionMsg("Compte activé avec succès !");
      setTimeout(() => setActionMsg(""), 3000);
      load();
    } catch (e) { 
      setActionMsg(e.response?.data?.message || "Erreur");
      setTimeout(() => setActionMsg(""), 3000);
    }
  };

  const handleRole = async (id, role) => {
    try {
      await api.setUserRole(id, role);
      setActionMsg(`Rôle changé en "${role}".`);
      setTimeout(() => setActionMsg(""), 3000);
      load();
    } catch (e) { 
      setActionMsg(e.response?.data?.message || "Erreur");
      setTimeout(() => setActionMsg(""), 3000);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Supprimer définitivement ce compte ?")) return;
    try {
      await api.deleteUser(id);
      setActionMsg("Compte supprimé.");
      setTimeout(() => setActionMsg(""), 3000);
      load();
    } catch (e) { 
      setActionMsg(e.response?.data?.message || "Erreur");
      setTimeout(() => setActionMsg(""), 3000);
    }
  };

  const totalRevenue = stats?.globalStats?.find(s => s._id === "income")?.total  || 0;
  const totalExpense = stats?.globalStats?.find(s => s._id === "expense")?.total || 0;
  
  const activeUsers = users.filter(u => u.isActive);
  const inactiveUsers = users.filter(u => !u.isActive);
  const adminUsers = users.filter(u => u.role === "admin");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22 }}>⚙️ Administration</h2>
        <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>Panneau de contrôle — accès réservé aux administrateurs</p>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ background: "#ef444422", borderRadius: 8, padding: "10px 16px", color: C.red, fontSize: 13 }}>
          {error}
          <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: C.red, cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* Message d'action */}
      {actionMsg && (
        <div style={{ background: "#22c55e22", borderRadius: 8, padding: "10px 16px", color: C.green, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {actionMsg}
          <button onClick={() => setActionMsg("")} style={{ background: "none", border: "none", color: C.green, cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: C.surface, borderRadius: 10, padding: 4, width: "fit-content" }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: tab === i ? C.card : "transparent", color: tab === i ? C.text : C.muted, cursor: "pointer", fontWeight: tab === i ? 700 : 400, fontSize: 13, transition: "all .2s" }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Chargement…</div>
      ) : (
        <>
          {/* ── Tab 0 : Vue d'ensemble ── */}
          {tab === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
                <StatCard label="Utilisateurs"   value={stats?.users || users.length} icon="👥" color={C.accent} />
                <StatCard label="Budgets"        value={stats?.budgets || 0} icon="🎯" color={C.yellow} />
                <StatCard label="Transactions"   value={stats?.transactions || 0} icon="💳" color={C.muted} />
                <StatCard label="Revenus globaux" value={fmt(totalRevenue)} icon="📈" color={C.green} />
                <StatCard label="Dépenses globales" value={fmt(totalExpense)} icon="📉" color={C.red} />
              </div>

              <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                <h4 style={{ margin: "0 0 16px", fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Statut des comptes</h4>
                <div style={{ display: "flex", gap: 24 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: C.green }}>{activeUsers.length}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Actifs</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: C.yellow }}>{inactiveUsers.length}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>En attente</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: C.accent }}>{adminUsers.length}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Admins</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 1 : Utilisateurs ── */}
          {tab === 1 && (
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Tous les utilisateurs</h4>
                <span style={{ fontSize: 12, color: C.muted }}>{users.length} compte(s)</span>
              </div>
              {users.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                  <p>Aucun utilisateur trouvé.</p>
                  <p style={{ fontSize: 12, marginTop: 8 }}>Vérifiez que vous êtes connecté en tant qu'administrateur.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Utilisateur</th>
                      <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Email</th>
                      <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Rôle</th>
                      <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Statut</th>
                      <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Inscription</th>
                      <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u._id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : "#ffffff04" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.role === "admin" ? C.yellow + "33" : C.accent + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: u.role === "admin" ? C.yellow : C.accent }}>
                              {u.name?.slice(0, 2).toUpperCase() || "U"}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{u.name || "Sans nom"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>{u.email || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <select
                            value={u.role || "user"}
                            onChange={e => handleRole(u._id, e.target.value)}
                            style={{ background: u.role === "admin" ? C.yellow + "22" : C.accent + "22", color: u.role === "admin" ? C.yellow : C.accent, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            <option value="user">Utilisateur</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {u.isActive ? (
                            <span style={{ background: "#22c55e22", color: C.green, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>✅ Actif</span>
                          ) : (
                            <span style={{ background: "#f59e0b22", color: C.yellow, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>⏳ En attente</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-TN") : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {!u.isActive && (
                              <button onClick={() => handleActivate(u._id)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.green}44`, background: "#22c55e22", color: C.green, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                Activer
                              </button>
                            )}
                            <button onClick={() => handleDeleteUser(u._id)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid #ef444433`, background: "transparent", color: C.red, cursor: "pointer", fontSize: 12 }}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Tab 2 : Budgets partagés ── */}
          {tab === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{budgets.length} budget(s) partagé(s) dans le système</div>
              {budgets.length === 0 ? (
                <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 30, textAlign: "center", color: C.muted }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
                  <p>Aucun budget partagé.</p>
                </div>
              ) : (
                budgets.map(b => (
                  <div key={b._id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>👥 {b.name}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          Période : {b.period === "monthly" ? "Mensuelle" : b.period === "weekly" ? "Hebdomadaire" : "Personnalisée"} · Créé le {b.createdAt ? new Date(b.createdAt).toLocaleDateString("fr-TN") : "—"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: 12, color: C.muted }}>
                        <div style={{ fontWeight: 600, color: C.text }}>{b.owner?.name || "?"}</div>
                        <div>{b.owner?.email || "?"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <span style={{ background: C.accent + "22", color: C.accent, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                        Propriétaire : {b.owner?.name || "?"}
                      </span>
                      {b.members?.map(m => (
                        <span key={m._id} style={{ background: C.border, color: C.muted, borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                          👤 {m.name || "?"}
                        </span>
                      ))}
                    </div>
                    {b.globalLimit && (
                      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
                        Plafond : <span style={{ color: C.text, fontWeight: 600 }}>{fmt(b.globalLimit)}</span> · Seuil alerte : <span style={{ color: C.yellow }}>{b.alertThreshold}%</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}