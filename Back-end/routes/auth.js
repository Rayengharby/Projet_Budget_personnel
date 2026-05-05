const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "temp_secret", { expiresIn: "7d" });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Tous les champs sont requis." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email déjà utilisé." });
    }

    const user = await User.create({ name, email, password });
    res.status(201).json({
      success: true,
      message: "Compte créé. En attente de validation par l'administrateur.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email et mot de passe requis." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Identifiants incorrects." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Compte non encore activé par l'administrateur." });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me - version simplifiée sans protect
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Non autorisé" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "temp_secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Utilisateur introuvable" });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ success: false, message: "Token invalide" });
  }
});

module.exports = router;