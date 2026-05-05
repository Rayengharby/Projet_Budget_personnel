// LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const C = { bg: "#0f1117", card: "#21253a", border: "#2e3250", accent: "#6c63ff", text: "#e8eaf6", muted: "#7c82a8", red: "#ef4444" };
const inp = { background: "#1a1d27", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err,  setErr]  = useState("");
  const [loading, setLoading] = useState(false);
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async () => {
    setErr(""); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur de connexion.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>💰</div>
          <h1 style={{ color: C.text, margin: "8px 0 4px", fontSize: 28, fontWeight: 900 }}>BudgetCollab</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>Connexion à votre compte</p>
        </div>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28 }}>
          {err && <div style={{ background: "#ef444422", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{err}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Email</label>
              <input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="votre@email.tn" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Mot de passe</label>
              <input style={inp} type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            <button onClick={handleSubmit} disabled={loading} style={{ padding: "12px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </div>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: C.muted }}>
            Pas encore de compte ? <Link to="/register" style={{ color: C.accent, fontWeight: 600 }}>S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg,  setMsg]  = useState("");
  const [err,  setErr]  = useState("");
  const { register } = useAuth();

  const handleSubmit = async () => {
    setErr(""); setMsg("");
    try {
      await register(form.name, form.email, form.password);
      setMsg("Compte créé ! En attente de validation par l'administrateur.");
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur lors de l'inscription.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>💰</div>
          <h1 style={{ color: C.text, margin: "8px 0 4px", fontSize: 28, fontWeight: 900 }}>BudgetCollab</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>Créer un compte</p>
        </div>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28 }}>
          {err && <div style={{ background: "#ef444422", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{err}</div>}
          {msg && <div style={{ background: "#22c55e22", borderRadius: 8, padding: "10px 14px", color: "#22c55e", fontSize: 13, marginBottom: 16 }}>{msg}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["name","Nom complet","Votre nom","text"],["email","Email","votre@email.tn","email"],["password","Mot de passe","••••••••","password"]].map(([k,l,p,t]) => (
              <div key={k}>
                <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>{l}</label>
                <input style={inp} type={t} placeholder={p} value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} />
              </div>
            ))}
            <button onClick={handleSubmit} style={{ padding: "12px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4 }}>
              Créer mon compte
            </button>
          </div>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: C.muted }}>
            Déjà inscrit ? <Link to="/login" style={{ color: C.accent, fontWeight: 600 }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
