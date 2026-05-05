const express   = require("express");
const router    = express.Router();
const User      = require("../models/User");
const Budget    = require("../models/Budget");
const Transaction = require("../models/Transaction");
const Category  = require("../models/Category");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [users, budgets, transactions] = await Promise.all([
      User.countDocuments(),
      Budget.countDocuments(),
      Transaction.countDocuments(),
    ]);
    const globalStats = await Transaction.aggregate([
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);
    res.json({ success: true, users, budgets, transactions, globalStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/users/:id/activate — activer un compte
router.patch("/users/:id/activate", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    // TODO: envoyer email de confirmation à l'utilisateur
    res.json({ success: true, message: "Compte activé.", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/users/:id/role — changer le rôle
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ success: false, message: "Rôle invalide." });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Impossible de supprimer son propre compte." });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Compte supprimé." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/budgets — tous les budgets partagés
router.get("/budgets", async (req, res) => {
  try {
    const budgets = await Budget.find({ isShared: true })
      .populate("owner", "name email")
      .populate("members", "name email");
    res.json({ success: true, budgets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
