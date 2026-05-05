const mongoose = require("mongoose");
const dotenv   = require("dotenv");
const Category = require("./models/Category");
const User     = require("./models/User");
dotenv.config();

const defaultCategories = [
  { name: "Alimentation", icon: "🍔", color: "#f59e0b", isDefault: true },
  { name: "Transport",    icon: "🚗", color: "#3b82f6", isDefault: true },
  { name: "Logement",     icon: "🏠", color: "#8b5cf6", isDefault: true },
  { name: "Santé",        icon: "💊", color: "#ef4444", isDefault: true },
  { name: "Loisirs",      icon: "🎮", color: "#22c55e", isDefault: true },
  { name: "Études",       icon: "📚", color: "#06b6d4", isDefault: true },
  { name: "Autre",        icon: "📦", color: "#6b7280", isDefault: true },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/BudgetApp");
  console.log("✅ Connecté");

  // Catégories
  await Category.deleteMany({ isDefault: true });
  await Category.insertMany(defaultCategories);
  console.log("✅ Catégories insérées");

  // Admin par défaut
  const adminExists = await User.findOne({ role: "admin" });
  if (!adminExists) {
    await User.create({ name: "Administrateur", email: "admin@budgetcollab.tn", password: "Admin@1234", role: "admin", isActive: true });
    console.log("✅ Admin créé : admin@budgetcollab.tn / Admin@1234");
  }

  await mongoose.disconnect();
  console.log("🎉 Seed terminé");
}

seed().catch(err => { console.error(err); process.exit(1); });
