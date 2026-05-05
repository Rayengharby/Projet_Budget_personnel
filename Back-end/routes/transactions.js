const express      = require("express");
const router       = express.Router();
const Transaction  = require("../models/Transaction");
const Budget       = require("../models/Budget");
const { protect }  = require("../middleware/auth");

router.use(protect);  // toutes les routes nécessitent une authentification

// GET /api/transactions  — liste (filtrable)
router.get("/", async (req, res) => {
  try {
    const { type, category, budget, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Un user voit ses transactions + celles des budgets partagés dont il est membre
    const sharedBudgets = await Budget.find({ members: req.user._id }).select("_id");
    filter.$or = [
      { user: req.user._id },
      { budget: { $in: sharedBudgets.map(b => b._id) } },
    ];

    if (type)      filter.type     = type;
    if (category)  filter.category = category;
    if (budget)    filter.budget   = budget;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate("category", "name icon color")
      .populate("user", "name avatar")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/transactions  — créer
router.post("/", async (req, res) => {
  try {
    const { type, amount, description, date, category, budget, comment } = req.body;
    const tx = await Transaction.create({ type, amount, description, date, category, budget, comment, user: req.user._id });

    // Vérifier dépassement de budget et émettre alerte
    if (budget && type === "expense") {
      const b = await Budget.findById(budget).populate("categoryLimits.category");
      if (b) {
        const totalSpent = await Transaction.aggregate([
          { $match: { budget: b._id, type: "expense" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const spent = totalSpent[0]?.total || 0;
        const pct = b.globalLimit ? Math.round((spent / b.globalLimit) * 100) : 0;
        if (pct >= b.alertThreshold) {
          // TODO: envoyer notification (email/socket)
          console.log(`⚠️  Alerte budget ${b.name}: ${pct}% consommé`);
        }
      }
    }

    await tx.populate([{ path: "category", select: "name icon color" }, { path: "user", select: "name avatar" }]);
    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/transactions/:id  — modifier
router.put("/:id", async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: "Transaction introuvable." });
    if (tx.user.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Accès refusé." });

    const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("category", "name icon color").populate("user", "name avatar");
    res.json({ success: true, transaction: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/transactions/:id  — supprimer
router.delete("/:id", async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: "Transaction introuvable." });
    if (tx.user.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Accès refusé." });

    await tx.deleteOne();
    res.json({ success: true, message: "Transaction supprimée." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/transactions/stats  — statistiques tableau de bord
router.get("/stats/dashboard", async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth } } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const byCategory = await Transaction.aggregate([
      { $match: { user: userId, type: "expense", date: { $gte: startOfMonth } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
      { $unwind: "$cat" },
      { $project: { name: "$cat.name", icon: "$cat.icon", color: "$cat.color", total: 1 } },
      { $sort: { total: -1 } },
    ]);

    const evolution = await Transaction.aggregate([
      { $match: { user: userId, type: "expense" } },
      { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" } }, total: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]);

    const income  = stats.find(s => s._id === "income")?.total  || 0;
    const expense = stats.find(s => s._id === "expense")?.total || 0;

    res.json({ success: true, income, expense, balance: income - expense, byCategory, evolution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
