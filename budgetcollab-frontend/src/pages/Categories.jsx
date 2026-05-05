// CategoriesPage.jsx
import { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const C = { bg: "#0f1117", surface: "#1a1d27", card: "#21253a", border: "#2e3250", accent: "#6c63ff", green: "#22c55e", red: "#ef4444", yellow: "#f59e0b", text: "#e8eaf6", muted: "#7c82a8" };
const inp = { background: "#1a1d27", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

const COLORS = ["#f59e0b","#3b82f6","#8b5cf6","#ef4444","#22c55e","#06b6d4","#6b7280","#ec4899","#f97316","#14b8a6","#a855f7","#6366f1"];
const EMOJIS = ["🍔","🚗","🏠","💊","🎮","📚","📦","✈️","🎬","🛍️","💻","🎵","🏋️","☕","🐾","💡","🧹","📱","🎁","🏦"];

const EMPTY = { name: "", icon: "📦", color: "#6b7280" };

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.getCategories();
      console.log("API Response categories:", r);
      
      // CORRECTION: Extraire les données correctement
      let categoriesData = [];
      if (Array.isArray(r)) {
        categoriesData = r;
      } else if (r?.categories && Array.isArray(r.categories)) {
        categoriesData = r.categories;
      } else if (r?.data && Array.isArray(r.data)) {
        categoriesData = r.data;
      } else {
        categoriesData = [];
      }
      
      console.log("Categories extraites:", categoriesData);
      setCategories(categoriesData);
    } catch (e) { 
      console.error("Failed to load categories", e);
      setCategories([]);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const openCreate = () => { 
    setEditing(null); 
    setForm(EMPTY); 
    setErr(""); 
    setSuccessMsg("");
    setShowModal(true); 
  };
  
  const openEdit = (c) => {
    if (c.isDefault && user?.role !== "admin") return;
    setEditing(c._id); 
    setForm({ name: c.name, icon: c.icon, color: c.color }); 
    setErr(""); 
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setErr("");
    setSuccessMsg("");
    
    if (!form.name.trim()) { 
      setErr("Le nom est requis."); 
      return; 
    }
    
    try {
      let response;
      if (editing) {
        response = await api.updateCategory(editing, form);
        console.log("Update response:", response);
        setSuccessMsg("✅ Catégorie modifiée avec succès !");
      } else {
        response = await api.createCategory(form);
        console.log("Create response:", response);
        setSuccessMsg("✅ Catégorie créée avec succès !");
      }
      
      setShowModal(false);
      setForm(EMPTY);
      setEditing(null);
      
      // Recharger les catégories
      await load();
      
      // Afficher un message de succès temporaire
      setTimeout(() => setSuccessMsg(""), 3000);
      
    } catch (e) { 
      console.error("Error saving category:", e);
      setErr(e.response?.data?.message || "Erreur lors de l'enregistrement"); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      await api.deleteCategory(id);
      setSuccessMsg("✅ Catégorie supprimée !");
      await load();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) { 
      alert(e.response?.data?.message || "Erreur lors de la suppression"); 
    }
  };

  // Vérifier que categories est un tableau
  const defaultCats = Array.isArray(categories) ? categories.filter(c => c.isDefault === true) : [];
  const customCats = Array.isArray(categories) ? categories.filter(c => c.isDefault !== true) : [];

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
          <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22 }}>🏷️ Catégories</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>{categories.length} catégorie(s) disponible(s)</p>
        </div>
        <button onClick={openCreate} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nouvelle catégorie
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Chargement…</div>
      ) : (
        <>
          {/* Catégories par défaut */}
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Catégories par défaut</h3>
            {defaultCats.length === 0 ? (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 30, textAlign: "center" }}>
                <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Aucune catégorie par défaut.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                {defaultCats.map(c => (
                  <div key={c._id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: (c.color || "#6b7280") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {c.icon || "📦"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>Défaut · non supprimable</div>
                    </div>
                    {user?.role === "admin" && (
                      <button onClick={() => openEdit(c)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 12 }}>✏️</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catégories personnalisées */}
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Mes catégories personnalisées</h3>
            {customCats.length === 0 ? (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 30, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🏷️</div>
                <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Aucune catégorie personnalisée. Créez-en une !</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                {customCats.map(c => (
                  <div key={c._id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: (c.color || "#6b7280") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {c.icon || "📦"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>
                        <span style={{ background: (c.color || "#6b7280") + "33", color: c.color || "#6b7280", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                          {c.color || "#6b7280"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => openEdit(c)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 12 }}>✏️</button>
                      <button onClick={() => handleDelete(c._id)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid #ef444433`, background: "transparent", color: C.red, cursor: "pointer", fontSize: 12 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28, width: 440, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editing ? "Modifier" : "Nouvelle"} catégorie</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 20 }}>×</button>
            </div>

            {err && <div style={{ background: "#ef444422", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{err}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Aperçu */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: 16, background: (form.color || "#6b7280") + "22", border: `2px solid ${form.color || "#6b7280"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
                  {form.icon || "📦"}
                </div>
              </div>

              {/* Nom */}
              <div>
                <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Nom</label>
                <input style={inp} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex : Épargne" />
              </div>

              {/* Icône */}
              <div>
                <label style={{ fontSize: 12, color: C.muted, marginBottom: 8, display: "block", fontWeight: 600 }}>Icône</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto", padding: 4 }}>
                  {EMOJIS.map(e => (
                    <button 
                      key={e} 
                      onClick={() => setForm(f => ({...f, icon: e}))} 
                      style={{ 
                        width: 38, 
                        height: 38, 
                        borderRadius: 8, 
                        border: `2px solid ${form.icon === e ? C.accent : C.border}`, 
                        background: form.icon === e ? C.accent + "22" : "transparent", 
                        cursor: "pointer", 
                        fontSize: 20 
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleur */}
              <div>
                <label style={{ fontSize: 12, color: C.muted, marginBottom: 8, display: "block", fontWeight: 600 }}>Couleur</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {COLORS.map(color => (
                    <button 
                      key={color} 
                      onClick={() => setForm(f => ({...f, color}))} 
                      style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: "50%", 
                        background: color, 
                        border: `2px solid ${form.color === color ? "#fff" : "transparent"}`, 
                        cursor: "pointer", 
                        outline: form.color === color ? `2px solid ${color}` : "none", 
                        outlineOffset: 2 
                      }} 
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSubmit} 
                style={{ 
                  padding: "12px", 
                  borderRadius: 8, 
                  border: "none", 
                  background: C.accent, 
                  color: "#fff", 
                  fontWeight: 700, 
                  fontSize: 14, 
                  cursor: "pointer",
                  marginTop: 8
                }}
              >
                {editing ? "Mettre à jour" : "Créer la catégorie"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}