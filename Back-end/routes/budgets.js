const express     = require("express");
const router      = express.Router();
const Budget      = require("../models/Budget");
const Transaction = require("../models/Transaction");
const User        = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// GET /api/budgets — mes budgets (y compris partagés)
router.get("/", async (req, res) => {
  try {
    console.log("🔍 Récupération des budgets pour:", req.user._id);
    
    const budgets = await Budget.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
    .populate("owner", "name email avatar")
    .populate("members", "name email avatar");
    
    console.log(`✅ ${budgets.length} budgets trouvés`);
    
    res.json({ success: true, budgets });
  } catch (err) {
    console.error("❌ Erreur GET budgets:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/budgets — créer un budget
router.post("/", async (req, res) => {
  try {
    const budgetData = {
      ...req.body,
      owner: req.user._id,
      isShared: req.body.isShared || false
    };
    
    const budget = await Budget.create(budgetData);
    
    // Ajouter le budget à l'utilisateur
    await User.findByIdAndUpdate(req.user._id, { $push: { budgets: budget._id } });
    
    console.log("✅ Budget créé:", budget._id);
    
    res.status(201).json({ success: true, budget });
  } catch (err) {
    console.error("❌ Erreur création budget:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/budgets/:id/members — ajouter un membre (CORRIGÉ)
router.post("/:id/members", async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget introuvable." });
    }
    
    // Vérifier que l'utilisateur est le propriétaire
    if (budget.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Seul le propriétaire peut ajouter des membres." });
    }
    
    // Chercher l'utilisateur par email
    const member = await User.findOne({ email: req.body.email });
    
    if (!member) {
      return res.status(404).json({ success: false, message: "Utilisateur avec cet email introuvable." });
    }
    
    // Vérifier que ce n'est pas le propriétaire
    if (member._id.toString() === budget.owner.toString()) {
      return res.status(400).json({ success: false, message: "Le propriétaire est déjà membre." });
    }
    
    // Vérifier si déjà membre
    if (budget.members.includes(member._id)) {
      return res.status(400).json({ success: false, message: "Cet utilisateur est déjà membre." });
    }
    
    // Ajouter le membre
    budget.members.push(member._id);
    budget.isShared = true;
    await budget.save();
    
    // Ajouter le budget à l'utilisateur invité
    await User.findByIdAndUpdate(member._id, { $push: { budgets: budget._id } });
    
    // Récupérer le budget mis à jour avec les populations
    const updatedBudget = await Budget.findById(budget._id)
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");
    
    console.log(`✅ Membre ajouté: ${member.email} au budget ${budget.name}`);
    
    res.json({ 
      success: true, 
      budget: updatedBudget,
      message: `${member.name || member.email} a été ajouté au budget.`
    });
    
  } catch (err) {
    console.error("❌ Erreur ajout membre:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/budgets/:id/summary — état du budget
router.get("/:id/summary", async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate("owner", "name avatar email")
      .populate("members", "name avatar email")
      .populate("categoryLimits.category");
    
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget introuvable." });
    }
    
    // Vérifier l'accès
    const members = [budget.owner._id.toString(), ...budget.members.map(m => m._id.toString())];
    const isMember = members.includes(req.user._id.toString());
    
    if (!isMember && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Accès refusé." });
    }
    
    // Agrégation des dépenses
    const spent = await Transaction.aggregate([
      { $match: { budget: budget._id, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    
    const totalSpent = spent[0]?.total || 0;
    const pctGlobal = budget.globalLimit ? Math.round((totalSpent / budget.globalLimit) * 100) : null;
    const status = pctGlobal === null ? "ok" : pctGlobal >= 100 ? "exceeded" : pctGlobal >= (budget.alertThreshold || 80) ? "warning" : "ok";
    
    res.json({ 
      success: true, 
      budget, 
      totalSpent, 
      pctGlobal, 
      status 
    });
    
  } catch (err) {
    console.error("❌ Erreur summary:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/budgets/:id
router.delete("/:id", async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget introuvable." });
    }
    
    if (budget.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Accès refusé." });
    }
    
    // Retirer le budget de tous les utilisateurs
    await User.updateMany(
      { budgets: budget._id },
      { $pull: { budgets: budget._id } }
    );
    
    await budget.deleteOne();
    
    res.json({ success: true, message: "Budget supprimé." });
    
  } catch (err) {
    console.error("❌ Erreur suppression:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;