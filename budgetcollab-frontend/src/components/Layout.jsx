import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const C = {
  bg: '#0f1117', surface: '#1a1d27', border: '#2e3250',
  accent: '#6c63ff', accentL: '#8b84ff', muted: '#7c82a8', text: '#e8eaf6',
  red: '#ef4444', yellow: '#f59e0b',
};

// Navigation pour les utilisateurs normaux (AVEC Mes budgets)
const NAV_USER = [
  { to: '/',             icon: '📊', label: 'Tableau de bord', end: true },
  { to: '/transactions', icon: '💳', label: 'Transactions' },
  { to: '/budgets',      icon: '🎯', label: 'Mes budgets' },      // ← AJOUTÉ
  { to: '/shared',       icon: '👥', label: 'Budget partagé' },
  { to: '/profile',      icon: '👤', label: 'Mon profil' },
];

// Navigation complète pour les administrateurs
const NAV_ADMIN = [
  { to: '/',             icon: '📊', label: 'Tableau de bord', end: true },
  { to: '/transactions', icon: '💳', label: 'Transactions' },
  { to: '/budgets',      icon: '🎯', label: 'Mes budgets' },
  { to: '/shared',       icon: '👥', label: 'Budget partagé' },
  { to: '/categories',   icon: '🏷️',  label: 'Catégories' },
  { to: '/admin',        icon: '⚙️',  label: 'Administration', isAdmin: true },
  { to: '/profile',      icon: '👤', label: 'Mon profil' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  // Choisir la navigation selon le rôle
  const NAV = user?.role === 'admin' ? NAV_ADMIN : NAV_USER;

  const navStyle = (isActive, isAdmin = false) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 20px', textDecoration: 'none',
    fontSize: 14, transition: 'all .2s',
    borderLeft: isActive
      ? `3px solid ${isAdmin ? C.yellow : C.accent}`
      : '3px solid transparent',
    background: isActive
      ? (isAdmin ? C.yellow : C.accent) + '22'
      : 'transparent',
    color: isActive ? (isAdmin ? C.yellow : C.accentL) : C.muted,
    fontWeight: isActive ? 600 : 400,
    borderRadius: '0 8px 8px 0',
    marginRight: 12,
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 230, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 30 }}>💰</div>
          <div style={{ fontWeight: 900, fontSize: 18, marginTop: 4 }}>BudgetCollab</div>
          <div style={{ fontSize: 11, color: C.muted }}>Gestion collaborative</div>
        </div>

        {/* Nav links — dynamiques selon le rôle */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {NAV.map(({ to, icon, label, end, isAdmin }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => navStyle(isActive, isAdmin)}>
              <span style={{ fontSize: 17 }}>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.accentL, fontSize: 12, flexShrink: 0 }}>
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{user?.role === 'admin' ? '⚙️ Administrateur' : '👤 Utilisateur'}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .2s' }}
            onMouseEnter={e => { e.target.style.background = C.red + '22'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; }}>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
        <Outlet />
      </main>
    </div>
  );
}