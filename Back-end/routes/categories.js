const express    = require("express");
const router     = express.Router();
const Category   = require("../models/Category");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// GET /api/categories - UNIQUEMENT les catégories créées (sans celles par défaut)
router.get("/", async (req, res) => {
  try {
    // ← CHANGEMENT ICI : exclure isDefault: true
    const categories = await Category.find({ isDefault: { $ne: true } });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/categories — créer une catégorie personnalisée
router.post("/", async (req, res) => {
  try {
    const cat = await Category.create({ ...req.body, isDefault: false, createdBy: req.user._id });
    res.status(201).json({ success: true, category: cat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/categories/:id
router.put("/:id", async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: "Catégorie introuvable." });
    if (cat.isDefault && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Impossible de modifier une catégorie par défaut." });
    if (!cat.isDefault && cat.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Accès refusé." });

    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, category: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/categories/:id
router.delete("/:id", async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: "Catégorie introuvable." });
    if (cat.isDefault) return res.status(403).json({ success: false, message: "Impossible de supprimer une catégorie par défaut." });
    if (cat.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Accès refusé." });

    await cat.deleteOne();
    res.json({ success: true, message: "Catégorie supprimée." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;