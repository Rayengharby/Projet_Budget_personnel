// ProfilePage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const C = { bg: "#0f1117", surface: "#1a1d27", card: "#21253a", border: "#2e3250", accent: "#6c63ff", green: "#22c55e", red: "#ef4444", yellow: "#f59e0b", text: "#e8eaf6", muted: "#7c82a8" };
const inp = { background: "#1a1d27", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName]       = useState(user?.name || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [currPwd, setCurrPwd] = useState("");
  const [newPwd,  setNewPwd]  = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [pwdMsg,  setPwdMsg]  = useState("");
  const [pwdErr,  setPwdErr]  = useState("");
  const [loadingPwd, setLoadingPwd] = useState(false);

  const handleProfileSave = async () => {
    setProfileMsg(""); setProfileErr(""); setLoadingProfile(true);
    try {
      await api.updateProfile({ name });
      setProfileMsg("Profil mis à jour avec succès !");
    } catch (e) { setProfileErr(e.response?.data?.message || "Erreur"); }
    finally { setLoadingProfile(false); }
  };

  const handlePwdChange = async () => {
    setPwdMsg(""); setPwdErr(""); 
    if (!currPwd || !newPwd || !confPwd) { setPwdErr("Tous les champs sont requis."); return; }
    if (newPwd !== confPwd) { setPwdErr("Les nouveaux mots de passe ne correspondent pas."); return; }
    if (newPwd.length < 6) { setPwdErr("Le mot de passe doit contenir au moins 6 caractères."); return; }
    setLoadingPwd(true);
    try {
      await api.changePassword(currPwd, newPwd);
      setPwdMsg("Mot de passe modifié avec succès !");
      setCurrPwd(""); setNewPwd(""); setConfPwd("");
    } catch (e) { setPwdErr(e.response?.data?.message || "Erreur"); }
    finally { setLoadingPwd(false); }
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";
  const roleLabel = { admin: "Administrateur", user: "Utilisateur" };
  const roleColor = { admin: C.yellow, user: C.accent };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22 }}>👤 Mon Profil</h2>
        <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>Gérer vos informations personnelles</p>
      </div>

      {/* Carte identité */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.accent + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: C.accent, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{user?.email}</div>
          <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ background: roleColor[user?.role] + "22", color: roleColor[user?.role], borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
              {roleLabel[user?.role] || user?.role}
            </span>
            <span style={{ background: "#22c55e22", color: C.green, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
              ✅ Compte actif
            </span>
          </div>
        </div>
      </div>

      {/* Modifier le profil */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Informations générales</h3>

        {profileErr && <div style={{ background: "#ef444422", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{profileErr}</div>}
        {profileMsg && <div style={{ background: "#22c55e22", borderRadius: 8, padding: "10px 14px", color: C.green, fontSize: 13, marginBottom: 16 }}>{profileMsg}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Nom complet</label>
            <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>Email</label>
            <input style={{ ...inp, opacity: 0.6, cursor: "not-allowed" }} value={user?.email} readOnly />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>L'email ne peut pas être modifié.</div>
          </div>
          <button onClick={handleProfileSave} disabled={loadingProfile} style={{ padding: "12px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: loadingProfile ? 0.7 : 1, alignSelf: "flex-start", paddingLeft: 24, paddingRight: 24 }}>
            {loadingProfile ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Changer le mot de passe */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Sécurité — Changer le mot de passe</h3>

        {pwdErr && <div style={{ background: "#ef444422", borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 16 }}>{pwdErr}</div>}
        {pwdMsg && <div style={{ background: "#22c55e22", borderRadius: 8, padding: "10px 14px", color: C.green, fontSize: 13, marginBottom: 16 }}>{pwdMsg}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            [currPwd, setCurrPwd, "Mot de passe actuel", "Entrez votre mot de passe actuel"],
            [newPwd, setNewPwd, "Nouveau mot de passe", "Minimum 6 caractères"],
            [confPwd, setConfPwd, "Confirmer le nouveau mot de passe", "Répétez le nouveau mot de passe"],
          ].map(([val, setter, label, placeholder], i) => (
            <div key={i}>
              <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 }}>{label}</label>
              <input style={inp} type="password" value={val} onChange={e => setter(e.target.value)} placeholder={placeholder} />
            </div>
          ))}

          {/* Force du mot de passe */}
          {newPwd && (
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Force du mot de passe</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[6, 8, 10, 12].map((threshold, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: newPwd.length >= threshold ? [C.red, C.yellow, C.accent, C.green][i] : C.border }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                {newPwd.length < 6 ? "Trop court" : newPwd.length < 8 ? "Faible" : newPwd.length < 10 ? "Moyen" : newPwd.length < 12 ? "Bon" : "Excellent"}
              </div>
            </div>
          )}

          <button onClick={handlePwdChange} disabled={loadingPwd} style={{ padding: "12px", borderRadius: 8, border: "none", background: C.red, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: loadingPwd ? 0.7 : 1, alignSelf: "flex-start", paddingLeft: 24, paddingRight: 24 }}>
            {loadingPwd ? "Modification…" : "Changer le mot de passe"}
          </button>
        </div>
      </div>

      {/* Infos compte */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Informations du compte</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            ["Identifiant", user?._id, "🔑"],
            ["Rôle", roleLabel[user?.role] || user?.role, "🛡️"],
            ["Statut", "Actif", "✅"],
            ["Membre depuis", user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-TN", { year: "numeric", month: "long", day: "numeric" }) : "—", "📅"],
          ].map(([label, value, icon]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.muted }}>{icon} {label}</span>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 600, fontFamily: label === "Identifiant" ? "monospace" : "inherit", fontSize: label === "Identifiant" ? 11 : 13 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}