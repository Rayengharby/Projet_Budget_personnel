// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.get("/api/auth/me")
        .then(res => {
          // La réponse peut être { user: {...} } ou directement l'utilisateur
          const userData = res.data.user || res.data;
          console.log("Utilisateur chargé:", userData);
          console.log("Rôle chargé:", userData?.role);
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post("/api/auth/login", { email, password });
    
    console.log("=== LOGIN RESPONSE ===");
    console.log("Data reçue:", data);
    console.log("User:", data.user);
    console.log("Rôle:", data.user?.role);
    
    // Stocker le token
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    
    // Stocker l'utilisateur (prendre data.user ou data selon la structure)
    const userData = data.user || data;
    setUser(userData);
    
    return userData;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post("/api/auth/register", { name, email, password });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}