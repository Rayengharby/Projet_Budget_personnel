// Transactions.jsx - Version FINALE AVEC BUDGET

import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const C = {
  bg: "#0f1117", surface: "#1a1d27", card: "#21253a", border: "#2e3250",
  accent: "#6c63ff", green: "#22c55e", red: "#ef4444", yellow: "#f59e0b",
  text: "#e8eaf6", muted: "#7c82a8",
};

const inp = {
  background: "#1a1d27", border: `1px solid ${C.border}`, borderRadius: 8,
  padding: "10px 14px", color: C.text, fontSize: 13, outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "inherit",
};

const fmt = n =>
  new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(n || 0);

const EMPTY = {
  type: "expense", amount: "", description: "",
  date: new Date().toISOString().slice(0, 10),
  category: "", budget: "", comment: "",
};

export default function TransactionsPage() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [budgets,      setBudgets]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [catLoading,   setCatLoading]   = useState(true);
  const [catError,     setCatError]     = useState("");
  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [err,          setErr]          = useState("");
  const [filter,       setFilter]       = useState({ type: "", category: "" });
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);

  // ─── Chargement des catégories ──────────────
  const loadCategories = useCallback(async () => {
    setCatLoading(true);
    setCatError("");
    try {
      const res = await api.getCategories();
      let catsArray = null;
      
      if (res?.data?.categories) {
        catsArray = res.data.categories;
      } else if (res?.categories) {
        catsArray = res.categories;
      } else if (Array.isArray(res?.data)) {
        catsArray = res.data;
      } else if (Array.isArray(res)) {
        catsArray = res;
      }
      
      if (Array.isArray(catsArray)) {
        setCategories(catsArray);
      } else {
        setCategories([]);
        setCatError("Format de réponse inattendu du serveur.");
      }
    } catch (e) {
      setCategories([]);
      setCatError(`Erreur : ${e.message}`);
    } finally {
      setCatLoading(false);
    }
  }, []);

  // ─── Chargement des budgets (y compris partagés) ──────────────
  const loadBudgets = useCallback(async () => {
    try {
      const res = await api.getBudgets();
      let budgetsArray = [];
      
      if (res?.data?.budgets) {
        budgetsArray = res.data.budgets;
      } else if (res?.budgets) {
        budgetsArray = res.budgets;
      } else if (Array.isArray(res)) {
        budgetsArray = res;
      }
      
      console.log("📊 Budgets chargés:", budgetsArray.length);
      setBudgets(budgetsArray);
    } catch (error) {
      console.error("Erreur chargement budgets:", error);
      setBudgets([]);
    }
  }, []);

  // ─── Chargement des transactions ─────────────
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, 
        limit: 15,
      };
      
      if (filter.type) params.type = filter.type;
      if (filter.category) params.category = filter.category;
      
      const res = await api.getTransactions(params);
      
      let transactionsData = [];
      let totalCount = 0;
      
      if (res?.data?.transactions) {
        transactionsData = res.data.transactions;
        totalCount = res.data.total || 0;
      } else if (res?.transactions) {
        transactionsData = res.transactions;
        totalCount = res.total || 0;
      } else if (Array.isArray(res)) {
        transactionsData = res;
        totalCount = res.length;
      } else if (res?.data && Array.isArray(res.data)) {
        transactionsData = res.data;
        totalCount = res.data.length;
      }
      
      setTransactions(transactionsData);
      setTotal(totalCount);
      
    } catch (error) {
      console.error("❌ Erreur chargement transactions:", error);
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, filter.type, filter.category]);

  useEffect(() => {
    loadCategories();
    loadBudgets();
  }, [loadCategories, loadBudgets]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const openCreate = () => { 
    setEditing(null); 
    setForm(EMPTY); 
    setErr(""); 
    setShowModal(true);
  };

  const openEdit = (tx) => {
    setEditing(tx._id);
    setForm({
      type:        tx.type,
      amount:      tx.amount,
      description: tx.description,
      date:        tx.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      category:    tx.category?._id || tx.category || "",
      budget:      tx.budget || "",
      comment:     tx.comment || "",
    });
    setErr("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setErr("");
    if (!form.amount || !form.description || !form.category) {
      setErr("Montant, description et catégorie sont obligatoires.");
      return;
    }
    if (parseFloat(form.amount) <= 0) {
      setErr("Le montant doit être supérieur à 0.");
      return;
    }
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (!payload.budget) delete payload.budget;
      
      if (editing) {
        await api.updateTransaction(editing, payload);
      } else {
        await api.createTransaction(payload);
      }
      setShowModal(false);
      loadTransactions();
      loadBudgets(); // Recharger les budgets pour mettre à jour les progressions
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette transaction définitivement ?")) return;
    try {
      await api.deleteTransaction(id);
      loadTransactions();
      loadBudgets(); // Recharger les budgets après suppression
    } catch (e) {
      alert(e.response?.data?.message || "Erreur.");
    }
  };

  const pages = Math.ceil(total / 15);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22 }}>💳 Transactions</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>{total} opération(s) enregistrée(s)</p>
        </div>
        <button onClick={openCreate}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nouvelle transaction
        </button>
      </div>

      {/* Filtres */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select value={filter.type}
          onChange={e => { setFilter(f => ({ ...f, type: e.target.value })); setPage(1); }}
          style={{ ...inp, width: "auto", flex: 1, minWidth: 140 }}>
          <option value="">Tous types</option>
          <option value="income">📈 Revenus</option>
          <option value="expense">📉 Dépenses</option>
        </select>
        <select value={filter.category}
          onChange={e => { setFilter(f => ({ ...f, category: e.target.value })); setPage(1); }}
          style={{ ...inp, width: "auto", flex: 1, minWidth: 160 }}>
          <option value="">Toutes catégories</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <button onClick={() => { setFilter({ type: "", category: "" }); setPage(1); }}
          style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer" }}>
          Réinitialiser
        </button>
      </div>

      {/* Tableau des transactions */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Chargement…</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>💸</div>
            <p style={{ margin: 0 }}>Aucune transaction trouvée.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: C.muted }}>Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: C.muted }}>Description</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: C.muted }}>Catégorie</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: C.muted }}>Budget</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: C.muted }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: C.muted }}>Montant</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: C.muted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx._id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>
                      {new Date(tx.date).toLocaleDateString("fr-TN")}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      {tx.description}
                      {tx.comment && <div style={{ fontSize: 11, color: C.muted }}>💬 {tx.comment}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {tx.category ? (
                        <span style={{ background: (tx.category.color || "#6b7280") + "22", color: tx.category.color || C.muted, borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>
                          {tx.category.icon} {tx.category.name}
                        </span>
                      ) : <span style={{ color: C.muted }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      {tx.budget ? (
                        <span style={{ background: C.accent + "22", color: C.accent, borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>
                          👥 {tx.budget.name}
                        </span>
                      ) : <span style={{ color: C.muted }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: tx.type === "income" ? C.green + "22" : C.red + "22", color: tx.type === "income" ? C.green : C.red, borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>
                        {tx.type === "income" ? "📈 Revenu" : "📉 Dépense"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: tx.type === "income" ? C.green : C.red }}>
                      {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(tx)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: C.accent + "22", color: C.accent, cursor: "pointer" }}>✏️</button>
                        <button onClick={() => handleDelete(tx._id)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: C.red + "22", color: C.red, cursor: "pointer" }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16, borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ background: page === i + 1 ? C.accent : "transparent", color: page === i + 1 ? "#fff" : C.muted }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>→</button>
          </div>
        )}
      </div>

      {/* MODAL - Nouvelle transaction AVEC champ Budget */}
      {showModal && (
        <div onClick={e => e.target === e.currentTarget && setShowModal(false)} style={{ position: "fixed", inset: 0, background: "#000000aa", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, width: 500, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3>{editing ? "✏️ Modifier" : "➕ Nouvelle transaction"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: C.muted, fontSize: 22 }}>×</button>
            </div>
            
            {err && <div style={{ background: C.red + "22", padding: "10px", borderRadius: 8, marginBottom: 16, color: C.red }}>⚠️ {err}</div>}
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>Type *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["expense","income"].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${form.type === t ? (t === "income" ? C.green : C.red) : C.border}`, background: form.type === t ? (t === "income" ? C.green + "22" : C.red + "22") : "transparent", color: form.type === t ? (t === "income" ? C.green : C.red) : C.muted, cursor: "pointer", fontWeight: 600 }}>
                      {t === "income" ? "📈 Revenu" : "📉 Dépense"}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Montant */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>Montant (TND) *</label>
                <input style={inp} type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
              
              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>Description *</label>
                <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Courses, Salaire, etc." />
              </div>
              
              {/* Date */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>Date</label>
                <input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              
              {/* Catégorie */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>Catégorie *</label>
                <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">-- Sélectionner une catégorie --</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              
              {/* Budget - CHAMP AJOUTÉ */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>
                  Budget associé {budgets.length > 0 && <span style={{ color: C.green, fontSize: 11 }}>({budgets.length} disponible(s))</span>}
                </label>
                <select style={inp} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}>
                  <option value="">-- Aucun budget --</option>
                  {budgets.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.isShared ? "👥" : "👤"} {b.name} {b.globalLimit ? `(${fmt(b.globalLimit)})` : ""}
                    </option>
                  ))}
                </select>
                {budgets.length === 0 && (
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    💡 Aucun budget disponible. Créez un budget depuis la page "Budgets".
                  </p>
                )}
              </div>
              
              {/* Commentaire */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: "block" }}>Commentaire</label>
                <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="Note optionnelle..." />
              </div>
              
              <button onClick={handleSubmit} style={{ padding: "12px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
                {editing ? "💾 Mettre à jour" : "✅ Ajouter la transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}