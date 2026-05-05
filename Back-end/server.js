const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();
const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10kb" }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: "Trop de requêtes, réessayez plus tard." });
app.use("/api/", limiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/users",        require("./routes/users"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/budgets",      require("./routes/budgets"));
app.use("/api/categories",   require("./routes/categories"));
app.use("/api/admin",        require("./routes/admin"));

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Erreur serveur" });
});

// ── Connect DB & start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/budgetcollab")
  .then(() => {
    console.log("✅ MongoDB connecté");
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
  })
  .catch((err) => { console.error("❌ Erreur MongoDB :", err); process.exit(1); });
