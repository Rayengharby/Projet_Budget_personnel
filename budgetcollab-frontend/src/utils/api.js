// src/utils/api.js
import axios from "axios";

// Fonction helper pour extraire les données
const extractData = (response) => {
  console.log("Extracting data from:", response);
  
  // Si c'est déjà un tableau
  if (Array.isArray(response)) return response;
  
  // Si c'est un objet avec une propriété users (pour admin)
  if (response?.users && Array.isArray(response.users)) return response.users;
  
  // Si c'est un objet avec une propriété data
  if (response?.data && Array.isArray(response.data)) return response.data;
  
  // Si c'est un objet avec une propriété transactions
  if (response?.transactions && Array.isArray(response.transactions)) return response.transactions;
  
  // Si c'est un objet avec une propriété categories
  if (response?.categories && Array.isArray(response.categories)) return response.categories;
  
  // Si c'est un objet avec une propriété budgets
  if (response?.budgets && Array.isArray(response.budgets)) return response.budgets;
  
  // Sinon retourner un tableau vide
  console.warn("Format de données non reconnu:", response);
  return [];
};

const api = {
  // Auth
  login: (email, password) => axios.post("/api/auth/login", { email, password }).then(r => r.data),
  register: (name, email, password) => axios.post("/api/auth/register", { name, email, password }).then(r => r.data),
  me: () => axios.get("/api/auth/me").then(r => r.data),

  // Transactions
  getTransactions: (params = {}) => axios.get("/api/transactions", { params }).then(r => extractData(r.data)),
  createTransaction: (data) => axios.post("/api/transactions", data).then(r => r.data),
  updateTransaction: (id, data) => axios.put(`/api/transactions/${id}`, data).then(r => r.data),
  deleteTransaction: (id) => axios.delete(`/api/transactions/${id}`).then(r => r.data),
  getDashboardStats: () => axios.get("/api/transactions/stats/dashboard").then(r => r.data),

  // Budgets
  getBudgets: () => axios.get("/api/budgets").then(r => extractData(r.data)),
  createBudget: (data) => axios.post("/api/budgets", data).then(r => r.data),
  getBudgetSummary: (id) => axios.get(`/api/budgets/${id}/summary`).then(r => r.data),
  addMember: (id, email) => axios.post(`/api/budgets/${id}/members`, { email }).then(r => r.data),
  deleteBudget: (id) => axios.delete(`/api/budgets/${id}`).then(r => r.data),

  // Catégories
  getCategories: () => axios.get("/api/categories").then(r => extractData(r.data)),
  createCategory: (data) => axios.post("/api/categories", data).then(r => r.data),
  updateCategory: (id, data) => axios.put(`/api/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id) => axios.delete(`/api/categories/${id}`).then(r => r.data),

  // Admin
  getAdminStats: () => axios.get("/api/admin/stats").then(r => r.data),
  getUsers: () => axios.get("/api/admin/users").then(r => extractData(r.data)),  // ← Ici extractData va extraire users
  activateUser: (id) => axios.patch(`/api/admin/users/${id}/activate`).then(r => r.data),
  setUserRole: (id, role) => axios.patch(`/api/admin/users/${id}/role`, { role }).then(r => r.data),
  deleteUser: (id) => axios.delete(`/api/admin/users/${id}`).then(r => r.data),
  getSharedBudgets: () => axios.get("/api/admin/budgets").then(r => extractData(r.data)),

  // Profil
  updateProfile: (data) => axios.put("/api/users/me", data).then(r => r.data),
  changePassword: (curr, newP) => axios.put("/api/users/me/password", { currentPassword: curr, newPassword: newP }).then(r => r.data),
};

export default api;