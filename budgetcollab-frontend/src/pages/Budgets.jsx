// BudgetsPage.jsx
import { useState, useEffect } from "react";
import api from "../utils/api";

const C = { bg: "#0f1117", surface: "#1a1d27", card: "#21253a", border: "#2e3250", accent: "#6c63ff", green: "#22c55e", red: "#ef4444", yellow: "#f59e0b", text: "#e8eaf6", muted: "#7c82a8" };
const inp = { background: "#1a1d27", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
const fmt = n => new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(n || 0);

const EMPTY_BUDGET = { name: "", period: "monthly", startDate: new Date().toISOString().slice(0, 10), endDate: "", globalLimit: "", alertThreshold: 80 };

function ProgressBar({ pct, status }) {
  const color = status === "exceeded" ? C.red : status === "warning" ? C.yellow : C.green;
  return (
    <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct || 0, 100)}%`, height: "100%", background: color, borderRadius: 99, transition: "width .5s" }} />
    </div>
  );
}

function BudgetCard({ budget, onDelete, onViewSummary, onAddMember }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const r = await api.getBudgetSummary(budget._id);
        setSummary(r);
      } catch (e) {
        console.error("Failed to load budget summary", e);
        setSummary(null);
      }
    };
    loadSummary();
  }, [budget._id]);

  const statusLabel = { ok: "✅ Maîtrisé", warning: "⚠️ Proche limite", exceeded: "🔴 Dépassé" };
  const statusColor = { ok: C.green, warning: C.yellow, exceeded: C.red };

  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{budget.isShared ? "👥" : "👤"}</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{budget.name}</h3>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            {budget.period === "monthly" ? "Mensuel" : budget.period === "weekly" ? "Hebdomadaire" : "Personnalisé"} · Du {new Date(budget.startDate).toLocaleDateString("fr-TN")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {budget.isShared && (
            <button onClick={() => onAddMember(budget)} title="Ajouter un membre" style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 13 }}>👤+</button>
          )}
          <button onClick={() => onDelete(budget._id)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid #ef444433`, background: "transparent", color: C.red, cursor: "pointer", fontSize: 13 }}>🗑️</button>
        </div>
      </div>

      {/* Membres */}
      {budget.isShared && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[budget.owner, ...(budget.members || [])].slice(0, 4).map((m, i) => (
            <div key={i} title={m?.name} style={{ width: 28, height: 28, borderRadius: "50%", background: C.accent + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.accent, border: `2px solid ${C.card}`, marginLeft: i > 0 ? -8 : 0 }}>
              {m?.name?.slice(0, 2).toUpperCase() || "?"}
            </div>
          ))}
          <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>{1 + (budget.members?.length || 0)} membre(s)</span>
        </div>
      )}

      {/* Budget stats */}
      {budget.globalLimit && summary && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: C.muted }}>Consommé</span>
            <span style={{ fontWeight: 700, color: statusColor[summary.status] }}>
              {fmt(summary.totalSpent)} / {fmt(budget.globalLimit)}
            </span>
          </div>
          <ProgressBar pct={summary?.pctGlobal} status={summary?.status} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: C.muted }}>{summary?.pctGlobal ?? "—"}% utilisé</span>
            {summary && <span style={{ fontSize: 11, color: statusColor[summary.status], fontWeight: 600 }}>{statusLabel[summary.status]}</span>}
          </div>
        </div>
      )}

      {/* Seuil d'alerte */}
      <div style={{ fontSize: 12, color: C.muted }}>
        Seuil d'alerte : <span style={{ color: C.yellow, fontWeight: 600 }}>{budget.alertThreshold}%</span>
        {budget.globalLimit && <span> · Plafond : <span style={{ color: C.text, fontWeight: 600 }}>{fmt(budget.globalLimit)}</span></span>}
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [form, setForm] = useState(EMPTY_BUDGET);
  const [isShared, setIsShared] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [err, setErr] = useState("");
  const [memberErr, setMemberErr] = useState("");
  const [memberSuccess, setMemberSuccess] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.getBudgets(), 
        api.getCategories()
      ]);
      
      console.log("Budgets API response:", bRes);
      console.log("Categories API response:", cRes);
      
      // CORRECTION: Extraire les budgets correctement
      let budgetsData = [];
      if (Array.isArray(bRes)) {
        budgetsData = bRes;
      } else if (bRes?.budgets && Array.isArray(bRes.budgets)) {
        budgetsData = bRes.budgets;
      } else if (bRes?.data && Array.isArray(bRes.data)) {
        budgetsData = bRes.data;
      } else {
        budgetsData = [];
      }
      
      // CORRECTION: Extraire les catégories correctement
      let categoriesData = [];
      if (Array.isArray(cRes)) {
        categoriesData = cRes;
      } else if (cRes?.categories && Array.isArray(cRes.categories)) {
        categoriesData = cRes.categories;
      } else if (cRes?.data && Array.isArray(cRes.data)) {
        categoriesData = cRes.data;
      } else {
        categoriesData = [];
      }
      
      console.log("Budgets extraits:", budgetsData);
      console.log("Categories extraites:", categoriesData);
      
      setBudgets(budgetsData);
      setCategories(categoriesData);
    } catch (e) { 
      console.error("Failed to load budgets/categories", e);
      setBudgets([]);
      setCategories([]);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const openCreate = () => { 
    setForm(EMPTY_BUDGET); 
    setIsShared(false); 
    setErr(""); 
    setSuccessMsg("");
    setShowModal(true); 
  };

  const handleCreate = async () => {
    setErr("");
    setSuccessMsg("");
    
    if (!form.name || !form.startDate) { 
      setErr("Nom et date de début requis."); 
      return; 
    }
    
    try {
      const budgetData = { 
        ...form, 
        isShared, 
        globalLimit: form.globalLimit ? Number(form.globalLimit) : undefined, 
        alertThreshold: Number(form.alertThreshold) 
      };
      
      console.log("Creating budget:", budgetData);
      
      await api.createBudget(budgetData);
      
      setSuccessMsg("✅ Budget créé avec succès !");
      setShowModal(false);
      
      // Recharger les budgets
      await load();
      
      setTimeout(() => setSuccessMsg(""), 3000);
      
    } catch (e) { 
      console.error("Create budget error:", e);
      setErr(e.response?.data?.message || "Erreur lors de la création"); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce budget ?")) return;
    try {
      await api.deleteBudget(id);
      setSuccessMsg("✅ Budget supprimé !");
      await load();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      console.error("Delete failed", e);
      setErr("Erreur lors de la suppression");
    }
  };

  const openAddMember = (budget) => { 
    setSelectedBudget(budget); 
    setMemberEmail(""); 
    setMemberErr(""); 
    setMemberSuccess(""); 
    setShowMemberModal(true); 
  };

  const handleAddMember = async () => {
    setMemberErr(""); 
    setMemberSuccess("");
    if (!memberEmail) { 
      setMemberErr("Email requis."); 
      return; 
    }
    try {
      await api.addMember(selectedBudget._id, memberEmail);
      setMemberSuccess("✅ Membre ajouté avec succès !");
      setMemberEmail("");
      // Recharger après 1 seconde
      setTimeout(() => load(), 1000);
    } catch (e) { 
      setMemberErr(e.response?.data?.message || "Erreur lors de l'ajout"); 
    }
  };

  // Filtrer les budgets en toute sécurité
  const myBudgets = Array.isArray(budgets) ? budgets.filter(b => !b.isShared) : [];
  const sharedBudgets = Array.isArray(budgets) ? budgets.filter(b => b.isShared) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Message de succès */}
      {successMsg && (
        <div style={{ background: "#22c55e22", borderRadius: 8, padding: "10px 16px", color: C.green, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {successMsg}
          <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", color: C.green, cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22 }}>🎯 Mes Budgets</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>{budgets.length} budget(s) au total</p>
        </div>
        <button onClick={openCreate} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Créer un budget
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Chargement…</div>
      ) : (
        <>
          {/* Budgets individuels */}
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>👤 Budgets personnels</h3>
            {myBudgets.length === 0 ? (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 30, textAlign: "center", color: C.muted }}>Aucun budget personnel.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
                {myBudgets.map(b => <BudgetCard key={b._id} budget={b} onDelete={handleDelete} onAddMember={openAddMember} />)}
              </div>
            )}
          </div>

          {/* Budgets partagés */}
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>👥 Budgets partagés</h3>
            {sharedBudgets.length === 0 ? (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 30, textAlign: "center", color: C.muted }}>Aucun budget partagé.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
                {sharedBudgets.map(b => <BudgetCard key={b._id} budget={b} onDelete={handleDelete} onAddMember={openAddMember} />)}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Créer Budget */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, width: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Créer un budget</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 20 }}>×</button>
            </div>

            {err && <div style={{ background: "#ef444422", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{err}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Nom */}
              <div>
                <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Nom du budget</label>
                <input style={inp} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex : Budget familial mai 2025" />
              </div>

              {/* Type */}
              <div>
                <label style={{ fontSize: 12, color: C.muted, marginBottom: 6, display: "block", fontWeight: 600 }}>Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setIsShared(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${!isShared ? C.accent : C.border}`, background: !isShared ? C.accent + "22" : "transparent", color: !isShared ? C.accent : C.muted, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                    👤 Personnel
                  </button>
                  <button onClick={() => setIsShared(true)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${isShared ? C.accent : C.border}`, background: isShared ? C.accent + "22" : "transparent", color: isShared ? C.accent : C.muted, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                    👥 Partagé
                  </button>
                </div>
              </div>

              {/* Période */}
              <div>
                <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Période</label>
                <select style={inp} value={form.period} onChange={e => setForm(f => ({...f, period: e.target.value}))}>
                  <option value="monthly">Mensuelle</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="custom">Personnalisée</option>
                </select>
              </div>

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Date de début</label>
                  <input style={inp} type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} />
                </div>
                {form.period === "custom" && (
                  <div>
                    <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Date de fin</label>
                    <input style={inp} type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} />
                  </div>
                )}
              </div>

              {/* Plafond global */}
              <div>
                <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Plafond global (TND) <span style={{ color: C.muted, fontWeight: 400 }}>— optionnel</span></label>
                <input style={inp} type="number" min="0" step="1" value={form.globalLimit} onChange={e => setForm(f => ({...f, globalLimit: e.target.value}))} placeholder="Ex : 1500" />
              </div>

              {/* Seuil d'alerte */}
              <div>
                <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Seuil d'alerte : <span style={{ color: C.yellow }}>{form.alertThreshold}%</span></label>
                <input type="range" min="10" max="100" step="5" value={form.alertThreshold} onChange={e => setForm(f => ({...f, alertThreshold: e.target.value}))} style={{ width: "100%", accentColor: C.yellow }} />
              </div>

              <button onClick={handleCreate} style={{ padding: "12px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4 }}>
                Créer le budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter membre */}
      {showMemberModal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, width: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Ajouter un membre</h3>
              <button onClick={() => setShowMemberModal(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 20 }}>×</button>
            </div>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 0 }}>Budget : <strong style={{ color: C.text }}>{selectedBudget?.name}</strong></p>

            {memberErr && <div style={{ background: "#ef444422", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 12 }}>{memberErr}</div>}
            {memberSuccess && <div style={{ background: "#22c55e22", borderRadius: 8, padding: "10px 14px", color: C.green, fontSize: 13, marginBottom: 12 }}>{memberSuccess}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="email@exemple.tn" onKeyDown={e => e.key === "Enter" && handleAddMember()} />
              <button onClick={handleAddMember} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}