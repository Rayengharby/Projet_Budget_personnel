const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Vérifie le JWT ─────────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ success: false, message: "Non autorisé. Connectez-vous." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ success: false, message: "Utilisateur introuvable." });
    if (!req.user.isActive) return res.status(403).json({ success: false, message: "Compte non activé par l'administrateur." });
    next();
  } catch {
    res.status(401).json({ success: false, message: "Token invalide ou expiré." });
  }
};

// ── Vérifie le rôle ────────────────────────────────────────────────────────
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Accès refusé : droits insuffisants." });
  }
  next();
};
