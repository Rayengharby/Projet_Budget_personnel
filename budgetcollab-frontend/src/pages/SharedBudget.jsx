// SharedBudgetPage.jsx - Version CORRIGÉE (Problème d'extraction des données)

import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

const C = { 
  bg: "#0f1117", surface: "#1a1d27", card: "#21253a", border: "#2e3250", 
  accent: "#6c63ff", green: "#22c55e", red: "#ef4444", yellow: "#f59e0b", 
  text: "#e8eaf6", muted: "#7c82a8" 
};

const inp = { 
  background: "#1a1d27", border: `1px solid ${C.border}`, borderRadius: 8, 
  padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", 
  width: "100%", boxSizing: "border-box" 
};

const fmt = n => new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(n || 0);

function ProgressBar({ pct, status }) {
  const color = status === "exceeded" ? C.red : status === "warning" ? C.yellow : C.green;
  return (
    <div>
      <div style={{ background: C.border, borderRadius: 99, height: 10, overflow: "hidden", marginBottom: 4 }}>
        <div style={{ width: `${Math.min(pct || 0, 100)}%`, height: "100%", background: color, borderRadius: 99, transition: "width .5s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: C.muted }}>{pct ?? 0}% utilisé</span>
        <span style={{ color, fontWeight: 600 }}>
          {status === "exceeded" ? "🔴 Dépassé" : status === "warning" ? "⚠️ Proche limite" : "✅ Maîtrisé"}
        </span>
      </div>
    </div>
  );
}

function MemberAvatar({ member, size = 32 }) {
  const name = member?.name || member?.email || "?";
  const initial = name.charAt(0).toUpperCase();
  return (
    <div style={{ 
      width: size, height: size, borderRadius: "50%", background: C.accent + "33", 
      display: "flex", alignItems: "center", justifyContent: "center", 
      fontSize: size * 0.35, fontWeight: 700, color: C.accent, 
      border: `2px solid ${C.card}`, flexShrink: 0 
    }}>
      {initial}
    </div>
  );
}

export default function SharedBudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberErr, setMemberErr] = useState("");
  const [memberOk, setMemberOk] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Charger les budgets partagés - CORRIGÉ
  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      console.log("🔍 Chargement des budgets...");
      const response = await api.getBudgets();
      console.log("📦 Réponse brute:", response);
      
      // CORRECTION IMPORTANTE: Extraire correctement les données
      let allBudgets = [];
      
      if (response?.budgets && Array.isArray(response.budgets)) {
        allBudgets = response.budgets;
      } else if (Array.isArray(response)) {
        allBudgets = response;
      } else if (response?.data && Array.isArray(response.data)) {
        allBudgets = response.data;
      }
      
      console.log("📋 Tous les budgets:", allBudgets);
      console.log("📊 Nombre total:", allBudgets.length);
      
      // Filtrer les budgets partagés
      const sharedBudgets = allBudgets.filter(b => b.isShared === true);
      
      console.log(`✅ ${sharedBudgets.length} budgets partagés trouvés`);
      console.log("📋 Budgets partagés:", sharedBudgets);
      
      setBudgets(sharedBudgets);
      
      if (sharedBudgets.length > 0 && !selected) {
        selectBudget(sharedBudgets[0]);
      } else if (sharedBudgets.length === 0) {
        setSelected(null);
      }
    } catch (error) {
      console.error("❌ Erreur chargement budgets:", error);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  const selectBudget = async (b) => {
    setSelected(b);
    setLoadingDetail(true);
    try {
      console.log("🔍 Chargement détails budget:", b._id);
      
      const [sumRes, txRes] = await Promise.all([
        api.getBudgetSummary(b._id),
        api.getTransactions({ budget: b._id, limit: 50 }),
      ]);
      
      console.log("📊 Summary:", sumRes);
      console.log("📊 Transactions:", txRes);
      
      setSummary(sumRes);
      setTransactions(txRes.transactions || []);
    } catch (e) { 
      console.error("❌ Erreur chargement détails:", e); 
    } finally { 
      setLoadingDetail(false); 
    }
  };

  const handleAddMember = async () => {
    setMemberErr("");
    setMemberOk("");
    
    if (!memberEmail) {
      setMemberErr("Email requis.");
      return;
    }
    
    try {
      console.log("📤 Ajout membre:", memberEmail, "au budget:", selected._id);
      
      const response = await api.addMember(selected._id, memberEmail);
      console.log("✅ Réponse ajout membre:", response);
      
      setMemberOk(response.message || "Membre ajouté avec succès !");
      setMemberEmail("");
      
      // Recharger les budgets après 1 seconde
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
        setShowAddMember(false);
      }, 1500);
      
    } catch (e) {
      console.error("❌ Erreur ajout membre:", e);
      setMemberErr(e.response?.data?.message || "Erreur lors de l'ajout du membre.");
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
        ⏳ Chargement des budgets partagés...
      </div>
    );
  }

  // Affichage si aucun budget partagé
  if (budgets.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>👥</div>
        <h3 style={{ color: C.text }}>Aucun budget partagé</h3>
        <p style={{ color: C.muted, marginBottom: 8 }}>
          Vous n'avez pas encore de budget partagé.
        </p>
        <p style={{ color: C.muted, fontSize: 13 }}>
          Créez un budget partagé depuis la page "Mes budgets" et invitez des membres.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 120px)" }}>
      {/* Sidebar budgets partagés */}
      <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
          👥 Budgets partagés ({budgets.length})
        </h3>
        
        {budgets.map(b => (
          <button 
            key={b._id} 
            onClick={() => selectBudget(b)} 
            style={{ 
              textAlign: "left", 
              padding: "12px 14px", 
              borderRadius: 10, 
              border: `1px solid ${selected?._id === b._id ? C.accent : C.border}`, 
              background: selected?._id === b._id ? C.accent + "22" : C.card, 
              color: selected?._id === b._id ? C.accent : C.text, 
              cursor: "pointer", 
              fontWeight: selected?._id === b._id ? 700 : 400, 
              fontSize: 13,
              transition: "all 0.2s"
            }}>
            <div style={{ fontWeight: 600 }}>{b.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              👤 {b.owner?.name || "Propriétaire"} · {1 + (b.members?.length || 0)} membre(s)
            </div>
          </button>
        ))}
      </div>

      {/* Détail du budget sélectionné */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {!selected ? (
          <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
            Sélectionnez un budget partagé
          </div>
        ) : loadingDetail ? (
          <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
            ⏳ Chargement des détails...
          </div>
        ) : (
          <>
            {/* En-tête budget */}
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>👥 {selected.name}</h2>
                  <div style={{ fontSize: 13, color: C.muted }}>
                    {selected.period === "monthly" ? "Mensuel" : selected.period === "weekly" ? "Hebdomadaire" : "Personnalisé"} · 
                    Depuis le {new Date(selected.startDate).toLocaleDateString("fr-TN")}
                  </div>
                </div>
                {/* Vérifier si l'utilisateur est propriétaire pour ajouter des membres */}
                {summary?.budget?.owner?._id === summary?.currentUserId && (
                  <button 
                    onClick={() => { setShowAddMember(true); setMemberErr(""); setMemberOk(""); }} 
                    style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.accent}`, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    + Ajouter un membre
                  </button>
                )}
              </div>

              {/* Liste des membres */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  Membres ({1 + (summary?.budget?.members?.length || 0)})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {/* Propriétaire */}
                  {summary?.budget?.owner && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, borderRadius: 8, padding: "6px 10px" }}>
                      <MemberAvatar member={summary.budget.owner} size={28} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{summary.budget.owner.name || summary.budget.owner.email}</div>
                        <div style={{ fontSize: 10, color: C.accent }}>Propriétaire</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Membres */}
                  {summary?.budget?.members?.map((member, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, borderRadius: 8, padding: "6px 10px" }}>
                      <MemberAvatar member={member} size={28} />
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{member.name || member.email}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progression globale */}
              {selected.globalLimit && summary && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: C.muted }}>Progression globale</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                      {fmt(summary.totalSpent || 0)} / {fmt(selected.globalLimit)}
                    </span>
                  </div>
                  <ProgressBar pct={summary.pctGlobal} status={summary.status} />
                </div>
              )}
            </div>

            {/* Alertes */}
            {summary?.status === "exceeded" && (
              <div style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 10, padding: "12px 16px", color: C.red, fontSize: 13 }}>
                🔴 <strong>Budget dépassé !</strong> Les dépenses ont excédé le plafond fixé.
              </div>
            )}
            {summary?.status === "warning" && (
              <div style={{ background: "#f59e0b22", border: "1px solid #f59e0b44", borderRadius: 10, padding: "12px 16px", color: C.yellow, fontSize: 13 }}>
                ⚠️ <strong>Seuil d'alerte atteint</strong> ({summary.pctGlobal}% consommé).
              </div>
            )}

            {/* Transactions */}
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Transactions du budget</h4>
                <span style={{ fontSize: 12, color: C.muted }}>{transactions.length} opération(s)</span>
              </div>

              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>💸</div>
                  <p style={{ margin: 0, fontSize: 13 }}>Aucune transaction pour ce budget.</p>
                </div>
              ) : (
                <div>
                  {transactions.map((tx, i) => (
                    <div key={tx._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < transactions.length - 1 ? `1px solid ${C.border}` : "none", background: i % 2 === 0 ? "transparent" : "#ffffff04" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: (tx.category?.color || "#6b7280") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {tx.category?.icon || "📦"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{tx.description}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          {tx.category?.name} · {new Date(tx.date).toLocaleDateString("fr-FR")}
                          {tx.comment && <span> · 💬 {tx.comment}</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === "income" ? C.green : C.red }}>
                        {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                      </div>
                      <MemberAvatar member={tx.user} size={28} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal ajouter membre */}
      {showAddMember && (
        <div onClick={e => e.target === e.currentTarget && setShowAddMember(false)} style={{ position: "fixed", inset: 0, background: "#000000aa", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, width: 400, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>➕ Ajouter un membre</h3>
              <button onClick={() => setShowAddMember(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 24 }}>×</button>
            </div>

            {memberErr && (
              <div style={{ background: C.red + "22", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 12 }}>
                ❌ {memberErr}
              </div>
            )}
            
            {memberOk && (
              <div style={{ background: C.green + "22", borderRadius: 8, padding: "10px 14px", color: C.green, fontSize: 13, marginBottom: 12 }}>
                ✅ {memberOk}
              </div>
            )}

            <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Email de l'utilisateur</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input 
                style={inp} 
                type="email" 
                value={memberEmail} 
                onChange={e => setMemberEmail(e.target.value)} 
                placeholder="email@exemple.com"
                onKeyDown={e => e.key === "Enter" && handleAddMember()}
              />
              <button 
                onClick={handleAddMember} 
                style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                Ajouter
              </button>
            </div>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
              💡 L'utilisateur doit avoir un compte actif sur l'application.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}